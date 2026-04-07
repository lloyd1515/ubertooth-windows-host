import { runPowerShellJson } from './powershell.js';
import { discoverUbertoothDevices } from './windowsPnpDiscovery.js';
import { evaluateTransportReadiness } from './transportReadiness.js';

const PROPERTY_KEYS = Object.freeze({
  deviceDescription: 'DEVPKEY_Device_DeviceDesc',
  friendlyName: 'DEVPKEY_Device_FriendlyName',
  manufacturer: 'DEVPKEY_Device_Manufacturer',
  service: 'DEVPKEY_Device_Service',
  className: 'DEVPKEY_Device_Class',
  classGuid: 'DEVPKEY_Device_ClassGuid',
  driverVersion: 'DEVPKEY_Device_DriverVersion',
  driverProvider: 'DEVPKEY_Device_DriverProvider',
  locationInfo: 'DEVPKEY_Device_LocationInfo',
  busReportedDeviceDescription: 'DEVPKEY_Device_BusReportedDeviceDesc',
  containerId: 'DEVPKEY_Device_ContainerId'
});

export function buildBatchProbeScript(instanceIds) {
  const escapedIds = instanceIds.map(id => `'${String(id).replace(/'/g, "''")}'`).join(', ');
  const keyTable = Object.entries(PROPERTY_KEYS)
    .map(([name, key]) => `[PSCustomObject]@{ Name='${name}'; Key='${key}' }`)
    .join(', ');

  return [
    "$ErrorActionPreference = 'Stop'",
    `$instanceIds = @(${escapedIds})`,
    `$keys = @(${keyTable})`,
    "$allResults = foreach ($instanceId in $instanceIds) {",
    "  $deviceResults = foreach ($entry in $keys) {",
    "    try {",
    "      $value = Get-PnpDeviceProperty -InstanceId $instanceId -KeyName $entry.Key -ErrorAction Stop",
    "      [PSCustomObject]@{ DeviceId = $instanceId; Name = $entry.Name; Key = $entry.Key; Type = $value.Type; Data = $value.Data }",
    "    } catch {",
    "      [PSCustomObject]@{ DeviceId = $instanceId; Name = $entry.Name; Key = $entry.Key; Type = 'Unavailable'; Data = $null }",
    "    }",
    "  }",
    "  $deviceResults",
    "}",
    "$allResults | ConvertTo-Json -Depth 4 -Compress"
  ].join('; ');
}

export function normalizeBatchProbePayload(payload) {
  if (!payload) {
    return {};
  }

  const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
  const items = Array.isArray(parsed) ? parsed : [parsed];

  const results = {};
  for (const item of items) {
    if (!item) continue;
    if (!results[item.DeviceId]) {
      results[item.DeviceId] = {};
    }
    results[item.DeviceId][item.Name] = item.Data ?? null;
  }
  return results;
}

export async function probeUbertoothDevices({
  discoverDevices = discoverUbertoothDevices,
  execFileImpl,
  powershellExecutable = 'powershell.exe',
  timeoutMs = 15000,
  allowNonWindows = false
} = {}) {
  const devices = await discoverDevices({ execFileImpl, powershellExecutable, timeoutMs, allowNonWindows });
  if (devices.length === 0) return [];

  const script = buildBatchProbeScript(devices.map(d => d.pnpDeviceId));
  const stdout = await runPowerShellJson(script, {
    execFileImpl,
    powershellExecutable,
    timeoutMs,
    allowNonWindows
  });

  const batchProperties = normalizeBatchProbePayload(stdout);

  return devices.map(device => {
    const properties = batchProperties[device.pnpDeviceId] ?? {};
    return {
      ...device,
      properties,
      transportReadiness: evaluateTransportReadiness(device, properties)
    };
  });
}
