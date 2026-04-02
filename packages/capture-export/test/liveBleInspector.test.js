import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';

import {
  buildLiveBleInspectorArgs,
  getDefaultLiveBleToolPath,
  normalizeCaptureChannel,
  normalizeTimeoutSeconds,
  runLiveBleInspector
} from '../src/liveBleInspector.js';

test('buildLiveBleInspectorArgs defaults to follow mode only', () => {
  assert.deepEqual(buildLiveBleInspectorArgs(), ['-f']);
});

test('buildLiveBleInspectorArgs adds the upstream advertising channel flag', () => {
  assert.deepEqual(buildLiveBleInspectorArgs({ channel: 38 }), ['-f', '-A', '38']);
});

test('normalizeCaptureChannel rejects unsupported channels', () => {
  assert.throws(() => normalizeCaptureChannel(36), /--channel must be one of 37, 38, or 39/i);
});

test('normalizeTimeoutSeconds rejects non-positive timeout values', () => {
  assert.throws(() => normalizeTimeoutSeconds(0), /--timeout-seconds must be a positive number/i);
});

test('getDefaultLiveBleToolPath prefers a ubertooth-btle executable path', () => {
  assert.match(getDefaultLiveBleToolPath(), /ubertooth-btle/i);
});

test('runLiveBleInspector resolves after a successful child exit', async () => {
  const spawnCalls = [];
  const spawnImpl = (command, args) => {
    spawnCalls.push({ command, args });
    const child = new EventEmitter();
    child.kill = () => {};
    process.nextTick(() => child.emit('close', 0, null));
    return child;
  };

  const result = await runLiveBleInspector({
    toolPath: 'ubertooth-btle',
    channel: 37,
    spawnImpl,
    allowNonWindows: true
  });

  assert.equal(result.timedOut, false);
  assert.deepEqual(spawnCalls[0].args, ['-f', '-A', '37']);
});

test('runLiveBleInspector surfaces a missing tool clearly', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    child.kill = () => {};
    process.nextTick(() => child.emit('error', { code: 'ENOENT' }));
    return child;
  };

  await assert.rejects(
    runLiveBleInspector({
      toolPath: 'missing-ubertooth-btle.exe',
      spawnImpl,
      allowNonWindows: true
    }),
    /official ubertooth-btle executable/i
  );
});

test('runLiveBleInspector treats an intentional timeout stop as a bounded success', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    child.kill = () => process.nextTick(() => child.emit('close', 1, 'SIGTERM'));
    return child;
  };

  const result = await runLiveBleInspector({
    toolPath: 'ubertooth-btle',
    timeoutSeconds: 0.01,
    spawnImpl,
    allowNonWindows: true
  });

  assert.equal(result.timedOut, true);
});
