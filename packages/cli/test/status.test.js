import test from 'node:test';
import assert from 'node:assert/strict';

import { mergeStatusEntries } from '../src/status.js';

test('mergeStatusEntries attaches runtime info by PNP device id', () => {
  const merged = mergeStatusEntries(
    [{ pnpDeviceId: 'a', protocolInfo: { parsed: { firmwareRevision: 'x' } } }],
    [{ pnpDeviceId: 'a', runtimeInfo: { parsed: { leds: { usr: true } } } }]
  );

  assert.equal(merged[0].runtimeInfo.parsed.leds.usr, true);
});
