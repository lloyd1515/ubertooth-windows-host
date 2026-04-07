import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';

import { summarizePackets } from '../src/analyze.js';

test('summarizePackets calculates averages and counts from lines', async () => {
  const stream = Readable.from([
    'systime=1 ch=37 LAP=1 rssi=-60 s=-50\n',
    'systime=2 ch=38 LAP=1 rssi=-70 s=-60\n',
    'invalid line\n',
    'systime=3 ch=37 LAP=2 rssi=-80 s=-70\n'
  ]);

  const summary = await summarizePackets(stream);

  assert.equal(summary.packetCount, 3);
  assert.equal(summary.uniqueLaps.size, 2);
  assert.equal(summary.avgSnr, -60); // (-50 + -60 + -70) / 3 = -60
});
