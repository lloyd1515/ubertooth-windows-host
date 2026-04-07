import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { buildSpecanArgs, runSpecan } from '../src/commands/specanRunner.js';

test('buildSpecanArgs returns empty array with no options', () => {
  assert.deepEqual(buildSpecanArgs({}), []);
});

test('buildSpecanArgs includes -U flag for device index', () => {
  const args = buildSpecanArgs({ deviceIndex: 2 });
  assert.ok(args.includes('-U'));
  assert.ok(args.includes('2'));
});

test('runSpecan resolves on clean exit', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    child.kill = () => {};
    process.nextTick(() => child.emit('close', 0, null));
    return child;
  };

  const result = await runSpecan({ spawnImpl, allowNonWindows: true });
  assert.equal(result.exitCode, 0);
  assert.equal(result.timedOut, false);
});

test('runSpecan rejects on non-zero exit', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    child.kill = () => {};
    process.nextTick(() => child.emit('close', 1, null));
    return child;
  };

  await assert.rejects(
    runSpecan({ spawnImpl, allowNonWindows: true }),
    /UBT-EXE-001/
  );
});

test('runSpecan supports --output file', async () => {
  const tmp = mkdtempSync(path.join(tmpdir(), 'specan-test-'));
  const outFile = path.join(tmp, 'specan.txt');
  const { Readable } = await import('node:stream');

  try {
    const spawnImpl = () => {
      const child = new EventEmitter();
      const stdout = new Readable({ read() {} });
      child.stdout = stdout;
      child.kill = () => {};
      process.nextTick(() => {
        stdout.push(Buffer.from('2402 -55\n'));
        stdout.push(null);
        process.nextTick(() => child.emit('close', 0, null));
      });
      return child;
    };

    const result = await runSpecan({ outputPath: outFile, spawnImpl, allowNonWindows: true });
    assert.equal(result.outputPath, path.resolve(outFile));
    assert.ok(result.bytesWritten > 0);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('runSpecan passes timeout to runner', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    child.kill = () => process.nextTick(() => child.emit('close', 1, 'SIGTERM'));
    return child;
  };

  const result = await runSpecan({ timeoutSeconds: 0.01, spawnImpl, allowNonWindows: true });
  assert.equal(result.timedOut, true);
});
