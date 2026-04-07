import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDiscoveryScript,
  discoverUbertoothDevices,
  normalizeDiscoveryPayload
} from '../src/windowsPnpDiscovery.js';

test('buildDiscoveryScript targets the official Ubertooth runtime and DFU VID/PIDs', () => {
  const script = buildDiscoveryScript();
  assert.match(script, /PNPDeviceID LIKE 'USB\\\\VID_1D50&PID_6002%'/);
  assert.match(script, /PNPDeviceID LIKE 'USB\\\\VID_1D50&PID_6003%'/);
  assert.match(script, /Get-CimInstance Win32_PnPEntity/);
});

test('normalizeDiscoveryPayload handles a single JSON object', () => {
  const devices = normalizeDiscoveryPayload('{"Name":"Ubertooth One","PNPDeviceID":"USB\\\\VID_1D50&PID_6002\\\\ABC","Status":"OK","Manufacturer":"Great Scott Gadgets","ConfigManagerErrorCode":0}');
  assert.equal(devices.length, 1);
  assert.equal(devices[0].isUbertooth, true);
  assert.equal(devices[0].vendorId, '1D50');
});

test('discoverUbertoothDevices returns normalized devices from PowerShell output', async () => {
  const execFileImpl = async () => ({
    stdout: '[{"Name":"Ubertooth One","PNPDeviceID":"USB\\\\VID_1D50&PID_6002\\\\ABC","Status":"OK","Manufacturer":"Great Scott Gadgets","Service":"WinUSB","ConfigManagerErrorCode":0,"Present":true}]'
  });

  const devices = await discoverUbertoothDevices({ execFileImpl, allowNonWindows: true });
  assert.deepEqual(devices, [
    {
      name: 'Ubertooth One',
      manufacturer: 'Great Scott Gadgets',
      status: 'OK',
      pnpDeviceId: 'USB\\VID_1D50&PID_6002\\ABC',
      service: 'WinUSB',
      configManagerErrorCode: 0,
      present: true,
      vendorId: '1D50',
      productId: '6002',
      isUbertooth: true
    }
  ]);
});

test('discoverUbertoothDevices returns an empty list when no devices are present', async () => {
  const execFileImpl = async () => ({ stdout: '[]' });
  const devices = await discoverUbertoothDevices({ execFileImpl, allowNonWindows: true });
  assert.deepEqual(devices, []);
});
