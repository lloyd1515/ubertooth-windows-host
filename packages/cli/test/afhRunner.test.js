import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';

import { buildAfhArgs, runAfh } from '../src/commands/afhRunner.js';

test('buildAfhArgs returns empty array with no options', () => {
  assert.deepEqual(buildAfhArgs({}), []);
});

test('buildAfhArgs includes -U flag for device index', () => {
  const args = buildAfhArgs({ deviceIndex: 0 });
  assert.ok(args.includes('-U'));
  assert.ok(args.includes('0'));
});

test('runAfh resolves on clean exit', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    child.kill = () => {};
    process.nextTick(() => child.emit('close', 0, null));
    return child;
  };

  const result = await runAfh({ spawnImpl, allowNonWindows: true });
  assert.equal(result.exitCode, 0);
});

test('runAfh rejects on non-zero exit', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    child.kill = () => {};
    process.nextTick(() => child.emit('close', 1, null));
    return child;
  };

  await assert.rejects(runAfh({ spawnImpl, allowNonWindows: true }), /UBT-EXE-001/);
});

test('runAfh supports timeout', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    child.kill = () => process.nextTick(() => child.emit('close', 1, 'SIGTERM'));
    return child;
  };

  const result = await runAfh({ timeoutSeconds: 0.01, spawnImpl, allowNonWindows: true });
  assert.equal(result.timedOut, true);
});
