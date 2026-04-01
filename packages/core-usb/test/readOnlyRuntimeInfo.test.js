import test from 'node:test';
import assert from 'node:assert/strict';

import { getReadOnlyRuntimeInfo, normalizeRuntimePayload } from '../src/readOnlyRuntimeInfo.js';

test('normalizeRuntimePayload normalizes runtime request rows', () => {
  const rows = normalizeRuntimePayload('[{"key":"usrLed","request":3,"success":true,"error":0,"lengthTransferred":1,"bytes":[1]}]');
  assert.equal(rows[0].key, 'usrLed');
  assert.equal(rows[0].bytes[0], 1);
});

test('getReadOnlyRuntimeInfo combines interface discovery and parsed runtime values', async () => {
  const probeDevices = async () => ([{ name: 'Ubertooth One', pnpDeviceId: 'USB\\VID_1D50&PID_6002\\ABC' }]);
  const discoverInterfaces = async () => ([{ path: 'x', classGuid: '{a5dcbf10-6530-11d2-901f-00c04fb951ed}', status: 'Enabled' }]);
  const execFileImpl = async () => ({ stdout: '[{"key":"usrLed","request":3,"success":true,"error":0,"lengthTransferred":1,"bytes":[1]},{"key":"rxLed","request":5,"success":true,"error":0,"lengthTransferred":1,"bytes":[0]},{"key":"txLed","request":7,"success":true,"error":0,"lengthTransferred":1,"bytes":[1]},{"key":"cc1v8","request":9,"success":true,"error":0,"lengthTransferred":1,"bytes":[1]},{"key":"channel","request":11,"success":true,"error":0,"lengthTransferred":2,"bytes":[102,9]},{"key":"paEnabled","request":16,"success":true,"error":0,"lengthTransferred":1,"bytes":[1]},{"key":"highGainMode","request":18,"success":true,"error":0,"lengthTransferred":1,"bytes":[1]},{"key":"modulation","request":22,"success":true,"error":0,"lengthTransferred":1,"bytes":[1]},{"key":"paLevel","request":28,"success":true,"error":0,"lengthTransferred":1,"bytes":[7]},{"key":"squelch","request":37,"success":true,"error":0,"lengthTransferred":1,"bytes":[228]},{"key":"clock","request":41,"success":true,"error":0,"lengthTransferred":4,"bytes":[120,86,52,18]}]' });

  const result = await getReadOnlyRuntimeInfo({ probeDevices, discoverInterfaces, execFileImpl, allowNonWindows: true });
  assert.equal(result.length, 1);
  assert.equal(result[0].runtimeInfo.parsed.radio.channelMhz, 2406);
  assert.equal(result[0].runtimeInfo.parsed.radio.modulation.name, 'BT_LOW_ENERGY');
});
