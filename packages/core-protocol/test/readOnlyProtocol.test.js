import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatApiVersion,
  parseBoardId,
  parseCompileInfo,
  parseFirmwareRevision,
  parsePartNumber,
  parseReadOnlyResults,
  parseSerial
} from '../src/readOnlyProtocol.js';

test('formatApiVersion mirrors upstream x.xx display', () => {
  assert.equal(formatApiVersion(0x0107), '1.07');
});

test('parseFirmwareRevision handles git-style responses', () => {
  assert.equal(parseFirmwareRevision([0, 0, 10, 50, 48, 50, 48, 45, 49, 50, 45, 82, 49]), '2020-12-R1');
});

test('parseCompileInfo reads the length-prefixed string', () => {
  assert.equal(parseCompileInfo([5, 104, 101, 108, 108, 111]), 'hello');
});

test('parseBoardId maps to official board names', () => {
  assert.deepEqual(parseBoardId([1]), { value: 1, name: 'Ubertooth One' });
});

test('parseSerial formats the 16-byte serial as hex', () => {
  assert.equal(parseSerial([0, 4, 48, 0, 9, 72, 12, 44, 175, 202, 72, 239, 90, 194, 32, 0, 245]), '04300009480c2cafca48ef5ac22000f5');
});

test('parsePartNumber decodes little-endian part number bytes', () => {
  assert.deepEqual(parsePartNumber([0, 0x23, 0x17, 0x01, 0x25]), {
    value: 0x25011723,
    hex: '0x25011723'
  });
});

test('parseReadOnlyResults combines descriptor and control-read values', () => {
  const combined = parseReadOnlyResults([
    { key: 'firmwareRevision', bytes: [0, 0, 10, 50, 48, 50, 48, 45, 49, 50, 45, 82, 49] },
    { key: 'compileInfo', bytes: [5, 104, 101, 108, 108, 111] },
    { key: 'boardId', bytes: [1] },
    { key: 'serial', bytes: [0, 4, 48, 0, 9, 72, 12, 44, 175, 202, 72, 239, 90, 194, 32, 0, 245] },
    { key: 'partNumber', bytes: [0, 0x23, 0x17, 0x01, 0x25] }
  ], { bcdDevice: 0x0107 });

  assert.equal(combined.apiVersion.formatted, '1.07');
  assert.equal(combined.firmwareRevision, '2020-12-R1');
  assert.equal(combined.boardId.name, 'Ubertooth One');
});
