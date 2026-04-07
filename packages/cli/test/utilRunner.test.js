import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';

import { buildUtilArgs, runUtil } from '../src/commands/utilRunner.js';

test('buildUtilArgs returns empty array with no options', () => {
  assert.deepEqual(buildUtilArgs({}), []);
});

test('buildUtilArgs includes -U flag for device index', () => {
  assert.deepEqual(buildUtilArgs({ deviceIndex: 1 }), ['-U', '1']);
});

test('buildUtilArgs includes -v for version info', () => {
  assert.deepEqual(buildUtilArgs({ version: true }), ['-v']);
});

test('buildUtilArgs includes -r for reset', () => {
  assert.deepEqual(buildUtilArgs({ reset: true }), ['-r']);
});

test('runUtil resolves on clean exit', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    process.nextTick(() => child.emit('close', 0, null));
    return child;
  };

  const result = await runUtil({ spawnImpl, allowNonWindows: true });
  assert.equal(result.exitCode, 0);
});

test('runUtil rejects on non-zero exit', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    process.nextTick(() => child.emit('close', 1, null));
    return child;
  };

  await assert.rejects(runUtil({ spawnImpl, allowNonWindows: true }), /UBT-EXE-001/);
});
