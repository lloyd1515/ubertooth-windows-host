import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildBatchProbeScript,
  normalizeBatchProbePayload,
  probeUbertoothDevices
} from '../src/windowsPnpProbe.js';

test('buildBatchProbeScript includes the requested instance ids and property lookup', () => {
  const script = buildBatchProbeScript(['USB\\VID_1D50&PID_6002\\ABC']);
  assert.match(script, /Get-PnpDeviceProperty/);
  assert.match(script, /USB\\VID_1D50&PID_6002\\ABC/);
});

test('normalizeBatchProbePayload maps property rows into nested objects by DeviceId', () => {
  const payload = [
    { DeviceId: 'ID1', Name: 'driverProvider', Data: 'Microsoft' },
    { DeviceId: 'ID1', Name: 'className', Data: 'USBDevice' },
    { DeviceId: 'ID2', Name: 'driverProvider', Data: 'Custom' }
  ];
  const results = normalizeBatchProbePayload(JSON.stringify(payload));
  assert.deepEqual(results, {
    ID1: { driverProvider: 'Microsoft', className: 'USBDevice' },
    ID2: { driverProvider: 'Custom' }
  });
});

test('probeUbertoothDevices combines discovery, properties, and readiness using batching', async () => {
  let calls = 0;
  const execFileImpl = async () => {
    calls += 1;
    return {
      stdout: JSON.stringify([
        { DeviceId: 'USB\\VID_1D50&PID_6002\\ABC', Name: 'driverProvider', Data: 'Microsoft' },
        { DeviceId: 'USB\\VID_1D50&PID_6002\\ABC', Name: 'className', Data: 'USBDevice' },
        { DeviceId: 'USB\\VID_1D50&PID_6002\\ABC', Name: 'driverVersion', Data: '10.0.26100.1150' }
      ])
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
