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

export function buildProbeScript(instanceId) {
  const escapedInstanceId = String(instanceId).replace(/'/g, "''");
  const keyTable = Object.entries(PROPERTY_KEYS)
    .map(([name, key]) => `[PSCustomObject]@{ Name='${name}'; Key='${key}' }`)
    .join(', ');

  return [
    "$ErrorActionPreference = 'Stop'",
    `$instanceId = '${escapedInstanceId}'`,
    `$keys = @(${keyTable})`,
    "$results = foreach ($entry in $keys) {",
    "  try {",
    "    $value = Get-PnpDeviceProperty -InstanceId $instanceId -KeyName $entry.Key -ErrorAction Stop",
    "    [PSCustomObject]@{ Name = $entry.Name; Key = $entry.Key; Type = $value.Type; Data = $value.Data }",
    "  } catch {",
    "    [PSCustomObject]@{ Name = $entry.Name; Key = $entry.Key; Type = 'Unavailable'; Data = $null }",
    "  }",
    "}",
    "$results | ConvertTo-Json -Depth 4 -Compress"
  ].join('; ');
}

export function normalizeProbePayload(payload) {
  if (!payload) {
    return {};
  }

  const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
  const items = Array.isArray(parsed) ? parsed : [parsed];

  return Object.fromEntries(
    items
      .filter(Boolean)
      .map((item) => [item.Name, item.Data ?? null])
  );
}

export async function probeUbertoothDevices({
  discoverDevices = discoverUbertoothDevices,
  execFileImpl,
  powershellExecutable = 'powershell.exe',
  timeoutMs = 10000,
  allowNonWindows = false
} = {}) {
  const devices = await discoverDevices({ execFileImpl, powershellExecutable, timeoutMs, allowNonWindows });

  const probes = [];
  for (const device of devices) {
    const stdout = await runPowerShellJson(buildProbeScript(device.pnpDeviceId), {
      execFileImpl,
      powershellExecutable,
      timeoutMs,
      allowNonWindows
    });

    const properties = normalizeProbePayload(stdout);
    probes.push({
      ...device,
      properties,
      transportReadiness: evaluateTransportReadiness(device, properties)
    });
  }

  return probes;
}
