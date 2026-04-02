import {
  UBERTOOTH_USB_ID,
  describeMatch,
  matchesUbertoothPnpId
} from '../../core-protocol/src/ubertoothUsbIdentity.js';
import { runPowerShellJson } from './powershell.js';

export function buildDiscoveryScript({ vendorId = UBERTOOTH_USB_ID.vendorId, productId = UBERTOOTH_USB_ID.productId, dfuProductId = UBERTOOTH_USB_ID.dfuProductId } = {}) {
  return [
    "$ErrorActionPreference = 'Stop'",
    `$pattern = 'VID_${vendorId}&PID_(${productId}|${dfuProductId})'`,
    "$devices = @(Get-CimInstance Win32_PnPEntity | Where-Object { $_.PNPDeviceID -match $pattern } | Select-Object Name, Manufacturer, Status, PNPDeviceID, Service, ConfigManagerErrorCode, Present)",
    "if ($devices.Count -eq 0) { '[]' } else { $devices | ConvertTo-Json -Depth 4 -Compress }"
  ].join('; ');
}

export function normalizeDiscoveryPayload(payload) {
  if (!payload) {
    return [];
  }

  const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
  const items = Array.isArray(parsed) ? parsed : [parsed];

  return items
    .filter(Boolean)
    .map((item) => ({
      name: item.Name ?? 'Unknown Device',
      manufacturer: item.Manufacturer ?? null,
      status: item.Status ?? 'Unknown',
      pnpDeviceId: item.PNPDeviceID ?? null,
      service: item.Service ?? null,
      configManagerErrorCode: Number.isFinite(item.ConfigManagerErrorCode)
        ? item.ConfigManagerErrorCode
        : Number(item.ConfigManagerErrorCode ?? 0),
      present: item.Present ?? null,
      ...describeMatch(item)
    }))
    .filter((item) => matchesUbertoothPnpId(item.pnpDeviceId));
}

export async function discoverUbertoothDevices({
  execFileImpl,
  powershellExecutable = 'powershell.exe',
  timeoutMs = 10000,
  allowNonWindows = false
} = {}) {
  const script = buildDiscoveryScript();
  const stdout = await runPowerShellJson(script, {
    execFileImpl,
    powershellExecutable,
    timeoutMs,
    allowNonWindows
  });

  return normalizeDiscoveryPayload(stdout);
}
