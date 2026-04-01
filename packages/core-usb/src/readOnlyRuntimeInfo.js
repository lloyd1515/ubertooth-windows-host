import { parseRuntimeResults, READ_ONLY_RUNTIME_REQUESTS } from '../../core-protocol/src/readOnlyRuntime.js';
import { runPowerShellJson } from './powershell.js';
import { probeUbertoothDevices } from './windowsPnpProbe.js';
import { discoverDeviceInterfaces } from './windowsInterfaceDiscovery.js';
import { choosePreferredInterface } from './winUsbReadOnlyExperiment.js';

function buildRuntimeScript(interfacePath) {
  const escapedPath = String(interfacePath).replace(/'/g, "''");
  const requestRows = READ_ONLY_RUNTIME_REQUESTS
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
    'public static class WinUsbReadOnlyRuntime {',
    '  public const uint GENERIC_READ = 0x80000000;',
    '  public const uint GENERIC_WRITE = 0x40000000;',
    '  public const uint FILE_SHARE_READ = 0x00000001;',
    '  public const uint FILE_SHARE_WRITE = 0x00000002;',
    '  public const uint OPEN_EXISTING = 3;',
    '  public const uint FILE_ATTRIBUTE_NORMAL = 0x80;',
    '  public const uint FILE_FLAG_OVERLAPPED = 0x40000000;',
    '  [DllImport("kernel32.dll", SetLastError=true, CharSet=CharSet.Unicode)]',
    '  public static extern SafeFileHandle CreateFile(string lpFileName, uint dwDesiredAccess, uint dwShareMode, IntPtr lpSecurityAttributes, uint dwCreationDisposition, uint dwFlagsAndAttributes, IntPtr hTemplateFile);',
    '  [DllImport("winusb.dll", SetLastError=true)]',
    '  public static extern bool WinUsb_Initialize(SafeFileHandle DeviceHandle, out IntPtr InterfaceHandle);',
    '  [DllImport("winusb.dll", SetLastError=true)]',
    '  public static extern bool WinUsb_ControlTransfer(IntPtr InterfaceHandle, WINUSB_SETUP_PACKET SetupPacket, byte[] Buffer, uint BufferLength, out uint LengthTransferred, IntPtr Overlapped);',
    '  [DllImport("winusb.dll", SetLastError=true)]',
    '  public static extern bool WinUsb_Free(IntPtr InterfaceHandle);',
    '}',
    '"@',
    '$handle = [WinUsbReadOnlyRuntime]::CreateFile($interfacePath, [WinUsbReadOnlyRuntime]::GENERIC_READ -bor [WinUsbReadOnlyRuntime]::GENERIC_WRITE, [WinUsbReadOnlyRuntime]::FILE_SHARE_READ -bor [WinUsbReadOnlyRuntime]::FILE_SHARE_WRITE, [IntPtr]::Zero, [WinUsbReadOnlyRuntime]::OPEN_EXISTING, [WinUsbReadOnlyRuntime]::FILE_ATTRIBUTE_NORMAL -bor [WinUsbReadOnlyRuntime]::FILE_FLAG_OVERLAPPED, [IntPtr]::Zero)',
    'if ($handle.IsInvalid) { throw "CreateFile failed: $([Runtime.InteropServices.Marshal]::GetLastWin32Error())" }',
    '$iface = [IntPtr]::Zero',
    'if (-not [WinUsbReadOnlyRuntime]::WinUsb_Initialize($handle, [ref]$iface)) { $err = [Runtime.InteropServices.Marshal]::GetLastWin32Error(); $handle.Dispose(); throw "WinUsb_Initialize failed: $err" }',
    '$results = foreach ($request in $requests) {',
    '  $setup = New-Object WINUSB_SETUP_PACKET',
    '  $setup.RequestType = 0xC0',
    '  $setup.Request = [byte]$request.Request',
    '  $setup.Value = 0',
    '  $setup.Index = 0',
    '  $setup.Length = [uint16]$request.Length',
    '  $buffer = New-Object byte[] $request.Length',
    '  [uint32]$lengthTransferred = 0',
    '  $ok = [WinUsbReadOnlyRuntime]::WinUsb_ControlTransfer($iface, $setup, $buffer, [uint32]$request.Length, [ref]$lengthTransferred, [IntPtr]::Zero)',
    '  [PSCustomObject]@{',
    '    key = $request.Key',
    '    request = [int]$request.Request',
    '    success = $ok',
    '    error = if ($ok) { 0 } else { [Runtime.InteropServices.Marshal]::GetLastWin32Error() }',
    '    lengthTransferred = [int]$lengthTransferred',
    '    bytes = @($buffer | Select-Object -First $lengthTransferred | ForEach-Object { [int]$_ })',
    '  }',
    '}',
    '[WinUsbReadOnlyRuntime]::WinUsb_Free($iface) | Out-Null',
    '$handle.Dispose()',
    '$results | ConvertTo-Json -Depth 6 -Compress'
  ].join('\n');
}

export function normalizeRuntimePayload(payload) {
  if (!payload) {
    return [];
  }

  const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
  const entries = Array.isArray(parsed) ? parsed : [parsed];
  return entries.map((entry) => ({
    key: entry.key,
    request: Number(entry.request),
    success: Boolean(entry.success),
    error: Number(entry.error),
    lengthTransferred: Number(entry.lengthTransferred),
    bytes: Array.isArray(entry.bytes) ? entry.bytes.map(Number) : []
  }));
}

export async function getReadOnlyRuntimeInfo({
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
    let runtimeInfo = null;

    if (preferredInterface) {
      const stdout = await runPowerShellJson(buildRuntimeScript(preferredInterface.path), {
        execFileImpl,
        powershellExecutable,
        timeoutMs,
        allowNonWindows
      });
      const rawRequests = normalizeRuntimePayload(stdout);
      runtimeInfo = {
        rawRequests,
        parsed: parseRuntimeResults(rawRequests)
      };
    }

    results.push({
      ...device,
      interfaces,
      preferredInterfacePath: preferredInterface?.path ?? null,
      runtimeInfo
    });
  }

  return results;
}
