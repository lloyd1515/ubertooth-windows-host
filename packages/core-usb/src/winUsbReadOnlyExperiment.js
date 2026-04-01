import { runPowerShellJson } from './powershell.js';
import { probeUbertoothDevices } from './windowsPnpProbe.js';
import { discoverDeviceInterfaces } from './windowsInterfaceDiscovery.js';

const GENERIC_USB_INTERFACE_GUID = '{a5dcbf10-6530-11d2-901f-00c04fb951ed}';

function buildExperimentScript(interfacePath) {
  const escapedPath = String(interfacePath).replace(/'/g, "''");
  return [
    "$ErrorActionPreference = 'Stop'",
    `$interfacePath = '${escapedPath}'`,
    'Add-Type -TypeDefinition @"',
    'using System;',
    'using System.Runtime.InteropServices;',
    'using Microsoft.Win32.SafeHandles;',
    'public static class WinUsbReadOnlyProbe {',
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
    '  public static extern bool WinUsb_Free(IntPtr InterfaceHandle);',
    '}',
    '"@',
    '$handle = [WinUsbReadOnlyProbe]::CreateFile($interfacePath, [WinUsbReadOnlyProbe]::GENERIC_READ -bor [WinUsbReadOnlyProbe]::GENERIC_WRITE, [WinUsbReadOnlyProbe]::FILE_SHARE_READ -bor [WinUsbReadOnlyProbe]::FILE_SHARE_WRITE, [IntPtr]::Zero, [WinUsbReadOnlyProbe]::OPEN_EXISTING, [WinUsbReadOnlyProbe]::FILE_ATTRIBUTE_NORMAL -bor [WinUsbReadOnlyProbe]::FILE_FLAG_OVERLAPPED, [IntPtr]::Zero)',
    'if ($handle.IsInvalid) { throw "CreateFile failed: $([Runtime.InteropServices.Marshal]::GetLastWin32Error())" }',
    '$iface = [IntPtr]::Zero',
    'if (-not [WinUsbReadOnlyProbe]::WinUsb_Initialize($handle, [ref]$iface)) { $err = [Runtime.InteropServices.Marshal]::GetLastWin32Error(); $handle.Dispose(); throw "WinUsb_Initialize failed: $err" }',
    '[uint32]$len = 1',
    '[byte]$speed = 0',
    'if (-not [WinUsbReadOnlyProbe]::WinUsb_QueryDeviceInformation($iface, [WinUsbReadOnlyProbe]::DEVICE_SPEED, [ref]$len, [ref]$speed)) { $err = [Runtime.InteropServices.Marshal]::GetLastWin32Error(); [WinUsbReadOnlyProbe]::WinUsb_Free($iface) | Out-Null; $handle.Dispose(); throw "WinUsb_QueryDeviceInformation failed: $err" }',
    '$buffer = New-Object byte[] 18',
    '[uint32]$transferred = 0',
    'if (-not [WinUsbReadOnlyProbe]::WinUsb_GetDescriptor($iface, [WinUsbReadOnlyProbe]::USB_DEVICE_DESCRIPTOR_TYPE, 0, 0, $buffer, 18, [ref]$transferred)) { $err = [Runtime.InteropServices.Marshal]::GetLastWin32Error(); [WinUsbReadOnlyProbe]::WinUsb_Free($iface) | Out-Null; $handle.Dispose(); throw "WinUsb_GetDescriptor failed: $err" }',
    '[WinUsbReadOnlyProbe]::WinUsb_Free($iface) | Out-Null',
    '$handle.Dispose()',
    '$u16 = { param($lo, $hi) (([int]$lo) -bor (([int]$hi) -shl 8)) }',
    '$result = [PSCustomObject]@{',
    '  interfacePath = $interfacePath',
    '  success = $true',
    '  deviceSpeedCode = [int]$speed',
    '  deviceSpeedLabel = if ($speed -eq 3) { "high-or-higher" } elseif ($speed -eq 1) { "full-or-lower" } else { "unknown" }',
    '  descriptor = [PSCustomObject]@{',
    '    length = [int]$buffer[0]',
    '    descriptorType = [int]$buffer[1]',
    '    bcdUsb = (& $u16 $buffer[2] $buffer[3])',
    '    deviceClass = [int]$buffer[4]',
    '    deviceSubClass = [int]$buffer[5]',
    '    deviceProtocol = [int]$buffer[6]',
    '    maxPacketSize0 = [int]$buffer[7]',
    '    idVendor = (& $u16 $buffer[8] $buffer[9])',
    '    idProduct = (& $u16 $buffer[10] $buffer[11])',
    '    bcdDevice = (& $u16 $buffer[12] $buffer[13])',
    '    iManufacturer = [int]$buffer[14]',
    '    iProduct = [int]$buffer[15]',
    '    iSerialNumber = [int]$buffer[16]',
    '    numConfigurations = [int]$buffer[17]',
    '    rawBytes = @($buffer | ForEach-Object { [int]$_ })',
    '    bytesTransferred = [int]$transferred',
    '  }',
    '}',
    '$result | ConvertTo-Json -Depth 6 -Compress'
  ].join('\n');
}

export function choosePreferredInterface(interfaces) {
  return interfaces.find((entry) => entry.classGuid?.toLowerCase() === GENERIC_USB_INTERFACE_GUID)
    ?? interfaces.find((entry) => entry.status?.toLowerCase() === 'enabled')
    ?? interfaces[0]
    ?? null;
}

export function normalizeTransportCheckPayload(payload) {
  if (!payload) {
    return null;
  }

  const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
  return {
    interfacePath: parsed.interfacePath,
    success: Boolean(parsed.success),
    deviceSpeedCode: Number(parsed.deviceSpeedCode),
    deviceSpeedLabel: parsed.deviceSpeedLabel,
    descriptor: {
      length: Number(parsed.descriptor.length),
      descriptorType: Number(parsed.descriptor.descriptorType),
      bcdUsb: Number(parsed.descriptor.bcdUsb),
      deviceClass: Number(parsed.descriptor.deviceClass),
      deviceSubClass: Number(parsed.descriptor.deviceSubClass),
      deviceProtocol: Number(parsed.descriptor.deviceProtocol),
      maxPacketSize0: Number(parsed.descriptor.maxPacketSize0),
      idVendor: Number(parsed.descriptor.idVendor),
      idProduct: Number(parsed.descriptor.idProduct),
      bcdDevice: Number(parsed.descriptor.bcdDevice),
      iManufacturer: Number(parsed.descriptor.iManufacturer),
      iProduct: Number(parsed.descriptor.iProduct),
      iSerialNumber: Number(parsed.descriptor.iSerialNumber),
      numConfigurations: Number(parsed.descriptor.numConfigurations),
      rawBytes: Array.isArray(parsed.descriptor.rawBytes) ? parsed.descriptor.rawBytes.map(Number) : [],
      bytesTransferred: Number(parsed.descriptor.bytesTransferred)
    }
  };
}

export async function runReadOnlyWinUsbExperiment({
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
    let readOnlyWinUsb = null;

    if (preferredInterface) {
      const stdout = await runPowerShellJson(buildExperimentScript(preferredInterface.path), {
        execFileImpl,
        powershellExecutable,
        timeoutMs,
        allowNonWindows
      });
      readOnlyWinUsb = normalizeTransportCheckPayload(stdout);
    }

    results.push({
      ...device,
      interfaces,
      preferredInterfacePath: preferredInterface?.path ?? null,
      readOnlyWinUsb
    });
  }

  return results;
}
