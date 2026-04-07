import test from 'node:test';
import assert from 'node:assert/strict';

import { parsePacketLine, estimateDistance } from '../src/parsers/packetParser.js';

test('parsePacketLine extracts key-value pairs and converts types', () => {
  const line = 'systime=1712512345 ch=37 LAP=aabbcc rssi=-60';
  const packet = parsePacketLine(line);
  
  assert.equal(packet.systime, 1712512345);
  assert.equal(packet.ch, 37);
  assert.equal(packet.LAP, 'aabbcc');
  assert.equal(packet.rssi, '-60'); // not in numeric fields list yet
});

test('parsePacketLine ensures LAP is present', () => {
  const line = 'systime=123 ch=38';
  const packet = parsePacketLine(line);
  assert.equal(packet.LAP, 'UNKNOWN');
});

test('parsePacketLine returns null for non-matching lines', () => {
  assert.equal(parsePacketLine('no data here'), null);
  assert.equal(parsePacketLine(''), null);
});

test('estimateDistance calculates meters correctly', () => {
  // At -59 RSSI with -59 txPower, distance should be 10^0 = 1m
  assert.equal(estimateDistance(-59, -59, 2.0), 1);
  
  // At -79 RSSI (20dB loss) with -59 txPower and n=2.0
  // 10 ^ ((-59 - (-79)) / (10 * 2)) = 10 ^ (20 / 20) = 10m
  assert.equal(estimateDistance(-79, -59, 2.0), 10);
});
