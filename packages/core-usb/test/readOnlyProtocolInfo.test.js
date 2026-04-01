import test from 'node:test';
import assert from 'node:assert/strict';

import { getReadOnlyProtocolInfo, normalizeProtocolPayload } from '../src/readOnlyProtocolInfo.js';

test('normalizeProtocolPayload normalizes descriptor and request values', () => {
  const payload = normalizeProtocolPayload('{"interfacePath":"x","descriptor":{"bcdDevice":263,"idVendor":7504,"idProduct":24578},"requests":[{"key":"boardId","request":35,"success":true,"error":0,"lengthTransferred":1,"bytes":[1]}]}');
  assert.equal(payload.descriptor.bcdDevice, 263);
  assert.equal(payload.requests[0].key, 'boardId');
});

test('getReadOnlyProtocolInfo combines device, interface, and parsed protocol info', async () => {
  const probeDevices = async () => ([{
    name: 'Ubertooth One',
    pnpDeviceId: 'USB\\VID_1D50&PID_6002\\ABC',
    service: 'WINUSB',
    present: true,
    transportReadiness: { readyForReadOnlyWinUsbExperiment: true }
  }]);
  const discoverInterfaces = async () => ([
    { path: 'x', classGuid: '{a5dcbf10-6530-11d2-901f-00c04fb951ed}', status: 'Enabled' }
  ]);
  const execFileImpl = async () => ({
    stdout: '{"interfacePath":"x","descriptor":{"bcdDevice":263,"idVendor":7504,"idProduct":24578},"requests":[{"key":"firmwareRevision","request":33,"success":true,"error":0,"lengthTransferred":13,"bytes":[0,0,10,50,48,50,48,45,49,50,45,82,49]},{"key":"compileInfo","request":55,"success":true,"error":0,"lengthTransferred":6,"bytes":[5,104,101,108,108,111]},{"key":"boardId","request":35,"success":true,"error":0,"lengthTransferred":1,"bytes":[1]},{"key":"serial","request":14,"success":true,"error":0,"lengthTransferred":17,"bytes":[0,4,48,0,9,72,12,44,175,202,72,239,90,194,32,0,245]},{"key":"partNumber","request":15,"success":true,"error":0,"lengthTransferred":5,"bytes":[0,35,23,1,37]}]}'
  });

  const result = await getReadOnlyProtocolInfo({ probeDevices, discoverInterfaces, execFileImpl, allowNonWindows: true });
  assert.equal(result.length, 1);
  assert.equal(result[0].protocolInfo.parsed.apiVersion.formatted, '1.07');
  assert.equal(result[0].protocolInfo.parsed.firmwareRevision, '2020-12-R1');
  assert.equal(result[0].protocolInfo.parsed.boardId.name, 'Ubertooth One');
});
