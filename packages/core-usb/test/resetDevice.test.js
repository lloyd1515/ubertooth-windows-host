import test from 'node:test';
import assert from 'node:assert/strict';

import { buildResetScript, normalizeResetPayload, performGuardedReset } from '../src/resetDevice.js';

test('buildResetScript emits a control-out reset request', () => {
  const script = buildResetScript('x');
  assert.match(script, /RequestType = 0x40/);
  assert.match(script, /Request = 13/);
});

test('normalizeResetPayload marks expected disconnect errors', () => {
  const payload = normalizeResetPayload('{"interfacePath":"x","controlTransferSuccess":false,"errorCode":1167,"lengthTransferred":0}');
  assert.equal(payload.expectedDisconnectError, true);
});

test('performGuardedReset waits for the device to reappear', async () => {
  const states = [
    [{ pnpDeviceId: 'device-1', transportReadiness: { readyForReadOnlyWinUsbExperiment: true }, name: 'Ubertooth One' }],
    [],
    [{ pnpDeviceId: 'device-1', transportReadiness: { readyForReadOnlyWinUsbExperiment: true }, name: 'Ubertooth One' }]
  ];
  const probeDevices = async () => states.shift() ?? [];
  const discoverInterfaces = async () => ([{ path: 'iface', classGuid: '{a5dcbf10-6530-11d2-901f-00c04fb951ed}', status: 'Enabled' }]);
  const execFileImpl = async () => ({ stdout: '{"interfacePath":"iface","controlTransferSuccess":true,"errorCode":0,"lengthTransferred":0}' });

  const result = await performGuardedReset({
    probeDevices,
    discoverInterfaces,
    execFileImpl,
    allowNonWindows: true,
    reconnectTimeoutMs: 1200,
    pollIntervalMs: 10,
    skipInitialSleep: true
  });

  assert.equal(result.successful, true);
  assert.equal(result.postReset.pnpDeviceId, 'device-1');
});
