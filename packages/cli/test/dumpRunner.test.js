import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { buildDumpArgs, runDump } from '../src/commands/dumpRunner.js';

test('buildDumpArgs returns empty array with no options', () => {
  assert.deepEqual(buildDumpArgs({}), []);
});

test('buildDumpArgs includes -c flag for channel', () => {
  const args = buildDumpArgs({ channel: 37 });
  assert.ok(args.includes('-c'));
  assert.ok(args.includes('37'));
});

test('runDump resolves on clean exit', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    child.kill = () => {};
    process.nextTick(() => child.emit('close', 0, null));
    return child;
  };

  const result = await runDump({ spawnImpl, allowNonWindows: true });
  assert.equal(result.exitCode, 0);
});

test('runDump rejects on non-zero exit', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    child.kill = () => {};
    process.nextTick(() => child.emit('close', 1, null));
    return child;
  };

  await assert.rejects(runDump({ spawnImpl, allowNonWindows: true }), /UBT-EXE-001/);
});

test('runDump writes output to file', async () => {
  const tmp = mkdtempSync(path.join(tmpdir(), 'dump-test-'));
  const outFile = path.join(tmp, 'dump.bin');

  try {
    const spawnImpl = () => {
      const child = new EventEmitter();
      const stdout = new Readable({ read() {} });
      child.stdout = stdout;
      child.kill = () => {};
      process.nextTick(() => {
        stdout.push(Buffer.from([0x01, 0x02, 0x03]));
        stdout.push(null);
        process.nextTick(() => child.emit('close', 0, null));
      });
      return child;
    };

    const result = await runDump({ outputPath: outFile, spawnImpl, allowNonWindows: true });
    assert.equal(result.outputPath, path.resolve(outFile));
    assert.ok(result.bytesWritten > 0);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('runDump supports timeout', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    child.kill = () => process.nextTick(() => child.emit('close', 1, 'SIGTERM'));
    return child;
  };

  const result = await runDump({ timeoutSeconds: 0.01, spawnImpl, allowNonWindows: true });
  assert.equal(result.timedOut, true);
});
