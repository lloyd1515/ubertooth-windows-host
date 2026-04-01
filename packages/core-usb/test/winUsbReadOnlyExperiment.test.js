import test from 'node:test';
import assert from 'node:assert/strict';

import {
  choosePreferredInterface,
  normalizeTransportCheckPayload,
  runReadOnlyWinUsbExperiment
} from '../src/winUsbReadOnlyExperiment.js';

test('choosePreferredInterface prefers the generic USB device interface guid', () => {
  const chosen = choosePreferredInterface([
    { path: 'a', classGuid: '{11111111-1111-1111-1111-111111111111}', status: 'Enabled' },
    { path: 'b', classGuid: '{a5dcbf10-6530-11d2-901f-00c04fb951ed}', status: 'Enabled' }
  ]);

  assert.equal(chosen.path, 'b');
});

test('normalizeTransportCheckPayload normalizes descriptor values', () => {
  const payload = normalizeTransportCheckPayload('{"interfacePath":"x","success":true,"deviceSpeedCode":1,"deviceSpeedLabel":"full-or-lower","descriptor":{"length":18,"descriptorType":1,"bcdUsb":512,"deviceClass":255,"deviceSubClass":0,"deviceProtocol":0,"maxPacketSize0":64,"idVendor":7504,"idProduct":24578,"bcdDevice":263,"iManufacturer":1,"iProduct":2,"iSerialNumber":3,"numConfigurations":1,"rawBytes":[18,1],"bytesTransferred":18}}');
  assert.equal(payload.descriptor.idVendor, 7504);
  assert.equal(payload.descriptor.idProduct, 24578);
});

test('runReadOnlyWinUsbExperiment combines probe, interfaces, and WinUSB query result', async () => {
  const probeDevices = async () => ([{
    name: 'Ubertooth One',
    pnpDeviceId: 'USB\\VID_1D50&PID_6002\\ABC',
    present: true,
    transportReadiness: { readyForReadOnlyWinUsbExperiment: true }
  }]);
  const discoverInterfaces = async () => ([
    { path: 'x', classGuid: '{a5dcbf10-6530-11d2-901f-00c04fb951ed}', status: 'Enabled' }
  ]);
  const execFileImpl = async () => ({
    stdout: '{"interfacePath":"x","success":true,"deviceSpeedCode":1,"deviceSpeedLabel":"full-or-lower","descriptor":{"length":18,"descriptorType":1,"bcdUsb":512,"deviceClass":255,"deviceSubClass":0,"deviceProtocol":0,"maxPacketSize0":64,"idVendor":7504,"idProduct":24578,"bcdDevice":263,"iManufacturer":1,"iProduct":2,"iSerialNumber":3,"numConfigurations":1,"rawBytes":[18,1],"bytesTransferred":18}}'
  });

  const results = await runReadOnlyWinUsbExperiment({ probeDevices, discoverInterfaces, execFileImpl, allowNonWindows: true });
  assert.equal(results.length, 1);
  assert.equal(results[0].preferredInterfacePath, 'x');
  assert.equal(results[0].readOnlyWinUsb.descriptor.idVendor, 7504);
});
