import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildProbeScript,
  normalizeProbePayload,
  probeUbertoothDevices
} from '../src/windowsPnpProbe.js';

test('buildProbeScript includes the requested instance id and property lookup', () => {
  const script = buildProbeScript('USB\\VID_1D50&PID_6002\\ABC');
  assert.match(script, /Get-PnpDeviceProperty/);
  assert.match(script, /USB\\VID_1D50&PID_6002\\ABC/);
});

test('normalizeProbePayload maps property rows into an object', () => {
  const properties = normalizeProbePayload('[{"Name":"driverProvider","Data":"Microsoft"},{"Name":"className","Data":"USBDevice"}]');
  assert.deepEqual(properties, {
    driverProvider: 'Microsoft',
    className: 'USBDevice'
  });
});

test('probeUbertoothDevices combines discovery, properties, and readiness', async () => {
  let calls = 0;
  const execFileImpl = async () => {
    calls += 1;
    return {
      stdout: '[{"Name":"driverProvider","Data":"Microsoft"},{"Name":"className","Data":"USBDevice"},{"Name":"driverVersion","Data":"10.0.26100.1150"}]'
    };
  };

  const discoverDevices = async () => ([{
    name: 'Ubertooth One',
    manufacturer: 'WinUsb Device',
    status: 'OK',
    pnpDeviceId: 'USB\\VID_1D50&PID_6002\\ABC',
    service: 'WINUSB',
    configManagerErrorCode: 0,
    present: true,
    vendorId: '1D50',
    productId: '6002',
    isUbertooth: true
  }]);

  const probes = await probeUbertoothDevices({ discoverDevices, execFileImpl, allowNonWindows: true });
  assert.equal(calls, 1);
  assert.equal(probes.length, 1);
  assert.equal(probes[0].transportReadiness.readyForReadOnlyWinUsbExperiment, true);
  assert.equal(probes[0].properties.driverVersion, '10.0.26100.1150');
});
