import test from 'node:test';
import assert from 'node:assert/strict';

import { parseRuntimeResults } from '../src/readOnlyRuntime.js';

test('parseRuntimeResults decodes led, radio, and clock fields', () => {
  const result = parseRuntimeResults([
    { key: 'usrLed', bytes: [1] },
    { key: 'rxLed', bytes: [0] },
    { key: 'txLed', bytes: [1] },
    { key: 'cc1v8', bytes: [1] },
    { key: 'channel', bytes: [0x66, 0x09] },
    { key: 'paEnabled', bytes: [1] },
    { key: 'highGainMode', bytes: [1] },
    { key: 'modulation', bytes: [1] },
    { key: 'paLevel', bytes: [7] },
    { key: 'squelch', bytes: [0xE4] },
    { key: 'clock', bytes: [0x78, 0x56, 0x34, 0x12] }
  ]);

  assert.equal(result.leds.usr, true);
  assert.equal(result.radio.channelMhz, 2406);
  assert.equal(result.radio.bluetoothChannelIndex, 4);
  assert.equal(result.radio.modulation.name, 'BT_LOW_ENERGY');
  assert.equal(result.radio.squelch.signed, -28);
  assert.equal(result.clock.clkn, 0x12345678);
});
