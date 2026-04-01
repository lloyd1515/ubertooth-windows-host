import { parseReadOnlyResults, READ_ONLY_COMMAND_REQUESTS } from '../../core-protocol/src/readOnlyProtocol.js';
import { runPowerShellJson } from './powershell.js';
import { probeUbertoothDevices } from './windowsPnpProbe.js';
import { discoverDeviceInterfaces } from './windowsInterfaceDiscovery.js';
import { choosePreferredInterface, normalizeTransportCheckPayload } from './winUsbReadOnlyExperiment.js';

function buildProtocolScript(interfacePath) {
  const escapedPath = String(interfacePath).replace(/'/g, "''");
  const requestRows = READ_ONLY_COMMAND_REQUESTS
    .map((entry) => `[PSCustomObject]@{ Key='${entry.key}'; Request=${entry.request}; Length=${entry.length} }`)
    .join(', ');

  return [
    "$ErrorActionPreference = 'Stop'",
    `$interfacePath = '${escapedPath}'`,
    '$requests = @(' + requestRows + ')',
    'Add-Type -TypeDefinition @"',
    'using System;',
    'using System.Runtime.InteropServices;',
    'using Microsoft.Win32.SafeHandles;',
    '[StructLayout(LayoutKind.Sequential, Pack=1)]',
    'public struct WINUSB_SETUP_PACKET {',
    '  public byte RequestType;',
    '  public byte Request;',
    '  public ushort Value;',
    '  public ushort Index;',
    '  public ushort Length;',
    '}',
    'public static class WinUsbReadOnlyInfo {',
    '  public const uint GENERIC_READ = 0x80000000;',
    '  public const uint GENERIC_WRITE = 0x40000000;',
    '  public const uint FILE_SHARE_READ = 0x00000001;',
    '  public const uint FILE_SHARE_WRITE = 0x00000002;',
    '  public const uint OPEN_EXISTING = 3;',
    '  public const uint FILE_ATTRIBUTE_NORMAL = 0x80;',
    '  public const uint FILE_FLAG_OVERLAPPED = 0x40000000;',
    '  public const uint DEVICE_SPEED = 0x01;',
    '  public const byte USB_DEVICE_DESCRIPTOR_TYPE = 0x01;',
    '  [DllImport("kernel32.dll", SetLastError=true, CharSet=CharSet.Unicode)]',
    '  public static extern SafeFileHandle CreateFile(string lpFileName, uint dwDesiredAccess, uint dwShareMode, IntPtr lpSecurityAttributes, uint dwCreationDisposition, uint dwFlagsAndAttributes, IntPtr hTemplateFile);',
    '  [DllImport("winusb.dll", SetLastError=true)]',
    '  public static extern bool WinUsb_Initialize(SafeFileHandle DeviceHandle, out IntPtr InterfaceHandle);',
    '  [DllImport("winusb.dll", SetLastError=true)]',
    '  public static extern bool WinUsb_QueryDeviceInformation(IntPtr InterfaceHandle, uint InformationType, ref uint BufferLength, out byte Buffer);',
    '  [DllImport("winusb.dll", SetLastError=true)]',
    '  public static extern bool WinUsb_GetDescriptor(IntPtr InterfaceHandle, byte DescriptorType, byte Index, ushort LanguageID, byte[] Buffer, uint BufferLength, out uint LengthTransferred);',
    '  [DllImport("winusb.dll", SetLastError=true)]',
    '  public static extern bool WinUsb_ControlTransfer(IntPtr InterfaceHandle, WINUSB_SETUP_PACKET SetupPacket, byte[] Buffer, uint BufferLength, out uint LengthTransferred, IntPtr Overlapped);',
    '  [DllImport("winusb.dll", SetLastError=true)]',
    '  public static extern bool WinUsb_Free(IntPtr InterfaceHandle);',
    '}',
    '"@',
    '$handle = [WinUsbReadOnlyInfo]::CreateFile($interfacePath, [WinUsbReadOnlyInfo]::GENERIC_READ -bor [WinUsbReadOnlyInfo]::GENERIC_WRITE, [WinUsbReadOnlyInfo]::FILE_SHARE_READ -bor [WinUsbReadOnlyInfo]::FILE_SHARE_WRITE, [IntPtr]::Zero, [WinUsbReadOnlyInfo]::OPEN_EXISTING, [WinUsbReadOnlyInfo]::FILE_ATTRIBUTE_NORMAL -bor [WinUsbReadOnlyInfo]::FILE_FLAG_OVERLAPPED, [IntPtr]::Zero)',
    'if ($handle.IsInvalid) { throw "CreateFile failed: $([Runtime.InteropServices.Marshal]::GetLastWin32Error())" }',
    '$iface = [IntPtr]::Zero',
    'if (-not [WinUsbReadOnlyInfo]::WinUsb_Initialize($handle, [ref]$iface)) { $err = [Runtime.InteropServices.Marshal]::GetLastWin32Error(); $handle.Dispose(); throw "WinUsb_Initialize failed: $err" }',
    '[uint32]$speedLen = 1',
    '[byte]$speed = 0',
    'if (-not [WinUsbReadOnlyInfo]::WinUsb_QueryDeviceInformation($iface, [WinUsbReadOnlyInfo]::DEVICE_SPEED, [ref]$speedLen, [ref]$speed)) { $err = [Runtime.InteropServices.Marshal]::GetLastWin32Error(); [WinUsbReadOnlyInfo]::WinUsb_Free($iface) | Out-Null; $handle.Dispose(); throw "WinUsb_QueryDeviceInformation failed: $err" }',
    '$descriptorBytes = New-Object byte[] 18',
    '[uint32]$descriptorTransferred = 0',
    'if (-not [WinUsbReadOnlyInfo]::WinUsb_GetDescriptor($iface, [WinUsbReadOnlyInfo]::USB_DEVICE_DESCRIPTOR_TYPE, 0, 0, $descriptorBytes, 18, [ref]$descriptorTransferred)) { $err = [Runtime.InteropServices.Marshal]::GetLastWin32Error(); [WinUsbReadOnlyInfo]::WinUsb_Free($iface) | Out-Null; $handle.Dispose(); throw "WinUsb_GetDescriptor failed: $err" }',
    '$u16 = { param($lo, $hi) (([int]$lo) -bor (([int]$hi) -shl 8)) }',
    '$descriptor = [PSCustomObject]@{',
    '  bcdDevice = (& $u16 $descriptorBytes[12] $descriptorBytes[13])',
    '  idVendor = (& $u16 $descriptorBytes[8] $descriptorBytes[9])',
    '  idProduct = (& $u16 $descriptorBytes[10] $descriptorBytes[11])',
    '}',
    '$results = foreach ($request in $requests) {',
    '  $setup = New-Object WINUSB_SETUP_PACKET',
    '  $setup.RequestType = 0xC0',
    '  $setup.Request = [byte]$request.Request',
    '  $setup.Value = 0',
    '  $setup.Index = 0',
    '  $setup.Length = [uint16]$request.Length',
    '  $buffer = New-Object byte[] $request.Length',
    '  [uint32]$lengthTransferred = 0',
    '  $ok = [WinUsbReadOnlyInfo]::WinUsb_ControlTransfer($iface, $setup, $buffer, [uint32]$request.Length, [ref]$lengthTransferred, [IntPtr]::Zero)',
    '  [PSCustomObject]@{',
    '    key = $request.Key',
    '    request = [int]$request.Request',
    '    success = $ok',
    '    error = if ($ok) { 0 } else { [Runtime.InteropServices.Marshal]::GetLastWin32Error() }',
    '    lengthTransferred = [int]$lengthTransferred',
    '    bytes = @($buffer | Select-Object -First $lengthTransferred | ForEach-Object { [int]$_ })',
    '  }',
    '}',
    '[WinUsbReadOnlyInfo]::WinUsb_Free($iface) | Out-Null',
    '$handle.Dispose()',
    '$payload = [PSCustomObject]@{',
    '  interfacePath = $interfacePath',
    '  descriptor = $descriptor',
    '  requests = $results',
    '}',
    '$payload | ConvertTo-Json -Depth 6 -Compress'
  ].join('\n');
}

export function normalizeProtocolPayload(payload) {
  if (!payload) {
    return null;
  }

  const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
  return {
    interfacePath: parsed.interfacePath,
    descriptor: {
      bcdDevice: Number(parsed.descriptor.bcdDevice),
      idVendor: Number(parsed.descriptor.idVendor),
      idProduct: Number(parsed.descriptor.idProduct)
    },
    requests: Array.isArray(parsed.requests)
      ? parsed.requests.map((entry) => ({
          key: entry.key,
          request: Number(entry.request),
          success: Boolean(entry.success),
          error: Number(entry.error),
          lengthTransferred: Number(entry.lengthTransferred),
          bytes: Array.isArray(entry.bytes) ? entry.bytes.map(Number) : []
        }))
      : []
  };
}

export async function getReadOnlyProtocolInfo({
  probeDevices = probeUbertoothDevices,
  discoverInterfaces = discoverDeviceInterfaces,
  execFileImpl,
  powershellExecutable = 'powershell.exe',
  timeoutMs = 15000,
  allowNonWindows = false
} = {}) {
  const devices = await probeDevices({ execFileImpl, powershellExecutable, timeoutMs, allowNonWindows });
  const results = [];

  for (const device of devices) {
    const interfaces = await discoverInterfaces(device.pnpDeviceId, { execFileImpl, timeoutMs, allowNonWindows });
    const preferredInterface = choosePreferredInterface(interfaces);
    let transport = null;
    let protocol = null;

    if (preferredInterface) {
      const stdout = await runPowerShellJson(buildProtocolScript(preferredInterface.path), {
        execFileImpl,
        powershellExecutable,
        timeoutMs,
        allowNonWindows
      });
      const normalized = normalizeProtocolPayload(stdout);
      transport = normalizeTransportCheckPayload({
        interfacePath: normalized.interfacePath,
        success: true,
        deviceSpeedCode: 1,
        deviceSpeedLabel: 'full-or-lower',
        descriptor: {
          length: 18,
          descriptorType: 1,
          bcdUsb: 0x0200,
          deviceClass: 0xFF,
          deviceSubClass: 0,
          deviceProtocol: 0,
          maxPacketSize0: 64,
          idVendor: normalized.descriptor.idVendor,
          idProduct: normalized.descriptor.idProduct,
          bcdDevice: normalized.descriptor.bcdDevice,
          iManufacturer: 1,
          iProduct: 2,
          iSerialNumber: 3,
          numConfigurations: 1,
          rawBytes: [],
          bytesTransferred: 18
        }
      });
      protocol = {
        rawRequests: normalized.requests,
        parsed: parseReadOnlyResults(normalized.requests, normalized.descriptor)
      };
    }

    results.push({
      ...device,
      interfaces,
      preferredInterfacePath: preferredInterface?.path ?? null,
      readOnlyWinUsb: transport,
      protocolInfo: protocol
    });
  }

  return results;
}
