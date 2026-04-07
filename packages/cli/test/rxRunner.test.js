import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';

import { buildRxArgs, runRx } from '../src/commands/rxRunner.js';

test('buildRxArgs returns empty array with no options', () => {
  assert.deepEqual(buildRxArgs({}), []);
});

test('buildRxArgs includes -c flag for channel', () => {
  const args = buildRxArgs({ channel: 39 });
  assert.ok(args.includes('-c'));
  assert.ok(args.includes('39'));
});

test('buildRxArgs includes -U flag for device index', () => {
  const args = buildRxArgs({ deviceIndex: 1 });
  assert.ok(args.includes('-U'));
  assert.ok(args.includes('1'));
});

test('runRx resolves on clean exit', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    child.kill = () => {};
    process.nextTick(() => child.emit('close', 0, null));
    return child;
  };

  const result = await runRx({ spawnImpl, allowNonWindows: true });
  assert.equal(result.exitCode, 0);
});

test('runRx rejects on non-zero exit', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    child.kill = () => {};
    process.nextTick(() => child.emit('close', 1, null));
    return child;
  };

  await assert.rejects(runRx({ spawnImpl, allowNonWindows: true }), /UBT-EXE-001/);
});

test('runRx supports timeout', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    child.kill = () => process.nextTick(() => child.emit('close', 1, 'SIGTERM'));
    return child;
  };

  const result = await runRx({ timeoutSeconds: 0.01, spawnImpl, allowNonWindows: true });
  assert.equal(result.timedOut, true);
});
