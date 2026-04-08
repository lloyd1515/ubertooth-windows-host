import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  findUbertoothExe,
  buildExeArgs,
  runUbertoothExe
} from '../src/ubertoothExeRunner.js';

// --- findUbertoothExe ---

test('findUbertoothExe prefers the staged flash-tools build path', () => {
  const p = findUbertoothExe('ubertooth-specan');
  assert.match(p, /build[\\/]windows-flash-tools[\\/]ubertooth-specan\.exe$/i);
});

test('findUbertoothExe falls back to bare tool name when exe not found', () => {
  const p = findUbertoothExe('ubertooth-nonexistent');
  assert.equal(p, 'ubertooth-nonexistent');
});

// --- buildExeArgs ---

test('buildExeArgs returns empty array for no options', () => {
  assert.deepEqual(buildExeArgs({}), []);
});

test('buildExeArgs does not include outputPath (handled via streams in runUbertoothExe)', () => {
  const args = buildExeArgs({ outputPath: '/tmp/out.txt' });
  assert.ok(!args.includes('-o'));
  assert.ok(!args.includes(path.resolve('/tmp/out.txt')));
});

test('buildExeArgs includes extra args array', () => {
  const args = buildExeArgs({ extraArgs: ['-v', '-n'] });
  assert.deepEqual(args, ['-v', '-n']);
});

test('buildExeArgs filters out safety confirmation flag', () => {
  const args = buildExeArgs({ extraArgs: ['-v', '--i-confirm-antenna-is-attached'] });
  assert.ok(args.includes('-v'));
  assert.ok(!args.includes('--i-confirm-antenna-is-attached'));
});

// --- runUbertoothExe ---

test('runUbertoothExe resolves on clean exit (code 0)', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    child.kill = () => {};
    process.nextTick(() => child.emit('close', 0, null));
    return child;
  };

  const result = await runUbertoothExe({
    toolName: 'ubertooth-specan',
    spawnImpl,
    allowNonWindows: true
  });

  assert.equal(result.exitCode, 0);
  assert.equal(result.timedOut, false);
});

test('runUbertoothExe rejects on non-zero exit with UBT-EXE-001', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    child.kill = () => {};
    process.nextTick(() => child.emit('close', 1, null));
    return child;
  };

  await assert.rejects(
    runUbertoothExe({ toolName: 'ubertooth-specan', spawnImpl, allowNonWindows: true }),
    /UBT-EXE-001/
  );
});

test('runUbertoothExe rejects with UBT-EXE-NOTFOUND on ENOENT', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    child.kill = () => {};
    process.nextTick(() => child.emit('error', { code: 'ENOENT' }));
    return child;
  };

  await assert.rejects(
    runUbertoothExe({ toolName: 'ubertooth-specan', spawnImpl, allowNonWindows: true }),
    /UBT-EXE-NOTFOUND/
  );
});

test('runUbertoothExe resolves timedOut=true when timeout fires', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    child.kill = () => process.nextTick(() => child.emit('close', 1, 'SIGTERM'));
    return child;
  };

  const result = await runUbertoothExe({
    toolName: 'ubertooth-specan',
    timeoutSeconds: 0.01,
    spawnImpl,
    allowNonWindows: true
  });

  assert.equal(result.timedOut, true);
});

test('runUbertoothExe writes output to file when outputPath set', async () => {
  const tmp = mkdtempSync(path.join(tmpdir(), 'exe-runner-test-'));
  const outFile = path.join(tmp, 'out.txt');

  try {
    const spawnImpl = () => {
      const child = new EventEmitter();
      const stdout = new Readable({ read() {} });
      child.stdout = stdout;
      child.kill = () => {};

      process.nextTick(() => {
        stdout.push(Buffer.from('2402 -50\n2404 -48\n'));
        stdout.push(null);
        process.nextTick(() => child.emit('close', 0, null));
      });

      return child;
    };

    const result = await runUbertoothExe({
      toolName: 'ubertooth-specan',
      outputPath: outFile,
      spawnImpl,
      allowNonWindows: true
    });

    assert.equal(result.exitCode, 0);
    assert.equal(result.outputPath, path.resolve(outFile));
    assert.ok(result.bytesWritten > 0);

    const content = readFileSync(outFile, 'utf8');
    assert.ok(content.includes('2402'));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('runUbertoothExe rejects on Windows-only when platform check fails', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    child.kill = () => {};
    process.nextTick(() => child.emit('close', 0, null));
    return child;
  };

  await assert.rejects(
    runUbertoothExe({ toolName: 'ubertooth-specan', spawnImpl, allowNonWindows: false, platform: 'linux' }),
    /Windows hosts/
  );
});

test('runUbertoothExe passes extraArgs to spawn', async () => {
  let capturedArgs;
  const spawnImpl = (cmd, args) => {
    capturedArgs = args;
    const child = new EventEmitter();
    child.kill = () => {};
    process.nextTick(() => child.emit('close', 0, null));
    return child;
  };

  await runUbertoothExe({
    toolName: 'ubertooth-specan',
    extraArgs: ['-U', '0'],
    spawnImpl,
    allowNonWindows: true
  });

  assert.ok(capturedArgs.includes('-U'));
  assert.ok(capturedArgs.includes('0'));
});


