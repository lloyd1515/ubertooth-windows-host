import { runPowerShellJson } from './powershell.js';
import { probeUbertoothDevices } from './windowsPnpProbe.js';
import { discoverDeviceInterfaces } from './windowsInterfaceDiscovery.js';
import { choosePreferredInterface } from './winUsbReadOnlyExperiment.js';

const RESET_REQUEST = 13;
const EXPECTED_DISCONNECT_ERRORS = new Set([31, 1167, 995]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function buildResetScript(interfacePath) {
  const escapedPath = String(interfacePath).replace(/'/g, "''");
  return [
    "$ErrorActionPreference = 'Stop'",
    `$interfacePath = '${escapedPath}'`,
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
    'public static class WinUsbReset {',
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
    '$handle = [WinUsbReset]::CreateFile($interfacePath, [WinUsbReset]::GENERIC_READ -bor [WinUsbReset]::GENERIC_WRITE, [WinUsbReset]::FILE_SHARE_READ -bor [WinUsbReset]::FILE_SHARE_WRITE, [IntPtr]::Zero, [WinUsbReset]::OPEN_EXISTING, [WinUsbReset]::FILE_ATTRIBUTE_NORMAL -bor [WinUsbReset]::FILE_FLAG_OVERLAPPED, [IntPtr]::Zero)',
    'if ($handle.IsInvalid) { throw "CreateFile failed: $([Runtime.InteropServices.Marshal]::GetLastWin32Error())" }',
    '$iface = [IntPtr]::Zero',
    'if (-not [WinUsbReset]::WinUsb_Initialize($handle, [ref]$iface)) { $err = [Runtime.InteropServices.Marshal]::GetLastWin32Error(); $handle.Dispose(); throw "WinUsb_Initialize failed: $err" }',
    '$setup = New-Object WINUSB_SETUP_PACKET',
    '$setup.RequestType = 0x40',
    '$setup.Request = 13',
    '$setup.Value = 0',
    '$setup.Index = 0',
    '$setup.Length = 0',
    '$buffer = New-Object byte[] 0',
    '[uint32]$lengthTransferred = 0',
    '$ok = [WinUsbReset]::WinUsb_ControlTransfer($iface, $setup, $buffer, 0, [ref]$lengthTransferred, [IntPtr]::Zero)',
    '$errorCode = if ($ok) { 0 } else { [Runtime.InteropServices.Marshal]::GetLastWin32Error() }',
    '[WinUsbReset]::WinUsb_Free($iface) | Out-Null',
    '$handle.Dispose()',
    '$payload = [PSCustomObject]@{',
    '  interfacePath = $interfacePath',
    '  controlTransferSuccess = $ok',
    '  errorCode = $errorCode',
    '  lengthTransferred = [int]$lengthTransferred',
    '}',
    '$payload | ConvertTo-Json -Depth 4 -Compress'
  ].join('\n');
}

export function normalizeResetPayload(payload) {
  if (!payload) {
    return null;
  }

  const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
  const errorCode = Number(parsed.errorCode ?? 0);
  return {
    interfacePath: parsed.interfacePath,
    controlTransferSuccess: Boolean(parsed.controlTransferSuccess),
    errorCode,
    expectedDisconnectError: EXPECTED_DISCONNECT_ERRORS.has(errorCode),
    lengthTransferred: Number(parsed.lengthTransferred ?? 0)
  };
}

export async function performGuardedReset({
  probeDevices = probeUbertoothDevices,
  discoverInterfaces = discoverDeviceInterfaces,
  execFileImpl,
  powershellExecutable = 'powershell.exe',
  timeoutMs = 10000,
  reconnectTimeoutMs = 12000,
  pollIntervalMs = 500,
  allowNonWindows = false,
  skipInitialSleep = false
} = {}) {
  const preResetDevices = await probeDevices({ execFileImpl, powershellExecutable, timeoutMs, allowNonWindows });

  if (preResetDevices.length !== 1) {
    throw new Error('Reset guardrail failed: reset currently requires exactly one connected Ubertooth device.');
  }

  const target = preResetDevices[0];
  if (!target.transportReadiness?.readyForReadOnlyWinUsbExperiment) {
    throw new Error('Reset guardrail failed: device is not ready for a guarded WinUSB reset request.');
  }

  const interfaces = await discoverInterfaces(target.pnpDeviceId, { execFileImpl, timeoutMs, allowNonWindows });
  const preferredInterface = choosePreferredInterface(interfaces);
  if (!preferredInterface) {
    throw new Error('Reset guardrail failed: no usable Windows interface path was found for the device.');
  }

  const dispatch = normalizeResetPayload(await runPowerShellJson(buildResetScript(preferredInterface.path), {
    execFileImpl,
    powershellExecutable,
    timeoutMs,
    allowNonWindows
  }));

  const startedAt = Date.now();
  let reappeared = false;
  let postReset = null;
  let pollCount = 0;

  // Adaptive polling: start with a small delay for reboot, then poll frequently, then back off.
  if (!skipInitialSleep) {
    await sleep(1000); 
  }

  while ((Date.now() - startedAt) < reconnectTimeoutMs) {
    pollCount += 1;
    const devices = await probeDevices({ execFileImpl, powershellExecutable, timeoutMs, allowNonWindows });
    const matching = devices.find((entry) => entry.pnpDeviceId === target.pnpDeviceId)
      ?? (devices.length === 1 ? devices[0] : null);

    if (matching?.transportReadiness?.readyForReadOnlyWinUsbExperiment) {
      reappeared = true;
      postReset = matching;
      break;
    }

    // Adaptive interval: 200ms for the first 3s, then 500ms, then 1s backoff.
    const elapsed = Date.now() - startedAt;
    const nextInterval = elapsed < 3000 ? 200 : (elapsed < 8000 ? 500 : 1000);
    await sleep(nextInterval);
  }

  return {
    preReset: target,
    preferredInterfacePath: preferredInterface.path,
    dispatch,
    successful: reappeared,
    elapsedMs: Date.now() - startedAt,
    pollCount,
    postReset
  };
}
