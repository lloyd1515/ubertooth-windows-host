import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  buildLiveBleInspectorArgs,
  getDefaultLiveBleToolPath,
  normalizeCaptureChannel,
  normalizeTimeoutSeconds,
  validateOutputPath,
  runLiveBleInspector
} from '../src/liveBleInspector.js';

test('buildLiveBleInspectorArgs defaults to follow mode only', () => {
  assert.deepEqual(buildLiveBleInspectorArgs(), ['-f']);
});

test('buildLiveBleInspectorArgs adds the upstream advertising channel flag', () => {
  assert.deepEqual(buildLiveBleInspectorArgs({ channel: 38 }), ['-f', '-A', '38']);
});

test('buildLiveBleInspectorArgs adds rssi flag', () => {
  assert.deepEqual(buildLiveBleInspectorArgs({ rssi: true }), ['-f', '-r']);
});

test('buildLiveBleInspectorArgs adds follow flag', () => {
  assert.deepEqual(buildLiveBleInspectorArgs({ follow: true }), ['-f', '-C']);
});

test('buildLiveBleInspectorArgs adds target flag', () => {
  assert.deepEqual(buildLiveBleInspectorArgs({ target: 'AA:BB:CC:DD:EE:FF' }), ['-f', '-t', 'AA:BB:CC:DD:EE:FF']);
});

test('buildLiveBleInspectorArgs adds interval flag', () => {
  assert.deepEqual(buildLiveBleInspectorArgs({ interval: 100 }), ['-f', '-i', '100']);
});

test('normalizeCaptureChannel rejects unsupported channels', () => {
  assert.throws(() => normalizeCaptureChannel(79), /--channel must be between 0 and 78/i);
});

test('normalizeCaptureChannel accepts valid channels', () => {
  assert.equal(normalizeCaptureChannel(0), '0');
  assert.equal(normalizeCaptureChannel(37), '37');
  assert.equal(normalizeCaptureChannel(78), '78');
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
    /UBT-CAP-NOTFOUND/
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

// --- File export tests ---

test('validateOutputPath returns null when outputPath is null', () => {
  assert.equal(validateOutputPath(null), null);
});

test('validateOutputPath rejects a path whose parent directory does not exist', () => {
  assert.throws(
    () => validateOutputPath('/definitely/does/not/exist/capture.txt'),
    /output directory.*does not exist/i
  );
});

test('validateOutputPath resolves a valid path', () => {
  const tmp = mkdtempSync(path.join(tmpdir(), 'ble-export-test-'));
  try {
    const resolved = validateOutputPath(path.join(tmp, 'out.txt'));
    assert.equal(resolved, path.resolve(tmp, 'out.txt'));
  } finally {
    rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
});

test('runLiveBleInspector rejects cleanly when the output file stream errors', async () => {
  const tmp = mkdtempSync(path.join(tmpdir(), 'ble-export-test-'));
  const outFile = path.join(tmp, 'capture.txt');

  try {
    const spawnImpl = () => {
      const child = new EventEmitter();
      const stdout = new Readable({ read() {} });
      child.stdout = stdout;
      child.kill = () => {
        process.nextTick(() => child.emit('close', 1, 'SIGTERM'));
      };

      process.nextTick(() => {
        stdout.push(Buffer.from('data before error'));
      });

      return child;
    };

    // Create a directory at the output path so createWriteStream emits EISDIR
    const { mkdirSync } = await import('node:fs');
    mkdirSync(outFile);

    await assert.rejects(
      runLiveBleInspector({
        toolPath: 'ubertooth-btle',
        outputPath: outFile,
        spawnImpl,
        allowNonWindows: true
      }),
      /file write failed|EISDIR/i
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
});

function createPipedSpawnImpl(chunks, exitCode = 0) {
  return (command, args) => {
    const child = new EventEmitter();
    const stdout = new Readable({ read() {} });
    child.stdout = stdout;
    child.kill = () => {
      process.nextTick(() => child.emit('close', 1, 'SIGTERM'));
    };

    process.nextTick(() => {
      for (const chunk of chunks) {
        stdout.push(Buffer.from(chunk));
      }
      stdout.push(null);
      process.nextTick(() => child.emit('close', exitCode, null));
    });

    return child;
  };
}

test('runLiveBleInspector writes child stdout to outputPath when set', async () => {
  const tmp = mkdtempSync(path.join(tmpdir(), 'ble-export-test-'));
  const outFile = path.join(tmp, 'capture.txt');

  try {
    const result = await runLiveBleInspector({
      toolPath: 'ubertooth-btle',
      outputPath: outFile,
      spawnImpl: createPipedSpawnImpl(['systime=1234 ', 'Ch=37\n']),
      allowNonWindows: true
    });

    assert.equal(result.outputPath, path.resolve(outFile));
    assert.equal(result.bytesWritten, 19);
    assert.equal(result.timedOut, false);

    const content = readFileSync(outFile, 'utf8');
    assert.equal(content, 'systime=1234 Ch=37\n');
  } finally {
    rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
});

test('runLiveBleInspector omits outputPath and bytesWritten when no outputPath given', async () => {
  const spawnImpl = (command, args) => {
    const child = new EventEmitter();
    child.kill = () => {};
    process.nextTick(() => child.emit('close', 0, null));
    return child;
  };

  const result = await runLiveBleInspector({
    toolPath: 'ubertooth-btle',
    spawnImpl,
    allowNonWindows: true
  });

  assert.equal(result.timedOut, false);
  assert.equal('outputPath' in result, false);
  assert.equal('bytesWritten' in result, false);
});

test('runLiveBleInspector writes partial output on timed-out capture with outputPath', async () => {
  const tmp = mkdtempSync(path.join(tmpdir(), 'ble-export-test-'));
  const outFile = path.join(tmp, 'partial.txt');

  try {
    const spawnImpl = () => {
      const child = new EventEmitter();
      const stdout = new Readable({ read() {} });
      child.stdout = stdout;
      child.kill = () => {
        process.nextTick(() => child.emit('close', 1, 'SIGTERM'));
      };

      process.nextTick(() => {
        stdout.push(Buffer.from('partial data'));
      });

      return child;
    };

    const result = await runLiveBleInspector({
      toolPath: 'ubertooth-btle',
      outputPath: outFile,
      timeoutSeconds: 0.01,
      spawnImpl,
      allowNonWindows: true
    });

    assert.equal(result.timedOut, true);
    assert.equal(result.outputPath, path.resolve(outFile));
    assert.ok(result.bytesWritten > 0);

    const content = readFileSync(outFile, 'utf8');
    assert.ok(content.includes('partial data'));
  } finally {
    rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
});

// --- Retry and robustness tests ---

test('runLiveBleInspector retries on crash and succeeds on third attempt', async () => {
  let callCount = 0;
  const spawnImpl = () => {
    callCount++;
    const child = new EventEmitter();
    child.kill = () => {};
    if (callCount < 3) {
      process.nextTick(() => child.emit('close', 1, null));
    } else {
      process.nextTick(() => child.emit('close', 0, null));
    }
    return child;
  };

  const result = await runLiveBleInspector({
    toolPath: 'ubertooth-btle',
    spawnImpl,
    allowNonWindows: true,
    retryDelayMs: 0
  });

  assert.equal(result.timedOut, false);
  assert.equal(result.retryCount, 2);
  assert.equal(callCount, 3);
});

test('runLiveBleInspector throws UBT-CAP-002 after exhausting all retries', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    const stderr = new Readable({ read() {} });
    child.stderr = stderr;
    child.kill = () => {};
    process.nextTick(() => {
      stderr.push(Buffer.from('libusb error: -1'));
      stderr.push(null);
      process.nextTick(() => child.emit('close', 1, null));
    });
    return child;
  };

  await assert.rejects(
    runLiveBleInspector({
      toolPath: 'ubertooth-btle',
      spawnImpl,
      allowNonWindows: true,
      retryDelayMs: 0
    }),
    /UBT-CAP-002: process crashed 4 times.*libusb error: -1/
  );
});

test('runLiveBleInspector includes stderr in UBT-CAP error', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    const stderr = new Readable({ read() {} });
    child.stderr = stderr;
    child.kill = () => {};
    process.nextTick(() => {
      stderr.push(Buffer.from('could not open device'));
      stderr.push(null);
      process.nextTick(() => child.emit('close', 1, null));
    });
    return child;
  };

  await assert.rejects(
    runLiveBleInspector({
      toolPath: 'ubertooth-btle',
      spawnImpl,
      allowNonWindows: true,
      maxRetries: 0
    }),
    /UBT-CAP-002: process crashed 1 times.*could not open device/
  );
});

test('runLiveBleInspector does not retry on timeout', async () => {
  let callCount = 0;
  const spawnImpl = () => {
    callCount++;
    const child = new EventEmitter();
    child.kill = () => process.nextTick(() => child.emit('close', 1, 'SIGTERM'));
    return child;
  };

  const result = await runLiveBleInspector({
    toolPath: 'ubertooth-btle',
    timeoutSeconds: 0.01,
    spawnImpl,
    allowNonWindows: true,
    retryDelayMs: 0
  });

  assert.equal(result.timedOut, true);
  assert.equal(result.retryCount, 0);
  assert.equal(callCount, 1);
});

test('runLiveBleInspector includes retryCount 0 on first-attempt success', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    child.kill = () => {};
    process.nextTick(() => child.emit('close', 0, null));
    return child;
  };

  const result = await runLiveBleInspector({
    toolPath: 'ubertooth-btle',
    spawnImpl,
    allowNonWindows: true
  });

  assert.equal(result.retryCount, 0);
});

test('runLiveBleInspector throws UBT-CAP-BUSY when a capture is already active', async () => {
  let resolveCapture;
  const spawnImpl = () => {
    const child = new EventEmitter();
    child.kill = () => {};
    resolveCapture = () => child.emit('close', 0, null);
    return child;
  };

  const firstCapture = runLiveBleInspector({
    toolPath: 'ubertooth-btle',
    spawnImpl,
    allowNonWindows: true
  });

  await assert.rejects(
    runLiveBleInspector({
      toolPath: 'ubertooth-btle',
      spawnImpl,
      allowNonWindows: true
    }),
    /UBT-CAP-BUSY/
  );

  resolveCapture();
  await firstCapture;
});

test('runLiveBleInspector resets captureActive after successful capture', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    child.kill = () => {};
    process.nextTick(() => child.emit('close', 0, null));
    return child;
  };

  await runLiveBleInspector({ toolPath: 'ubertooth-btle', spawnImpl, allowNonWindows: true });

  const result = await runLiveBleInspector({ toolPath: 'ubertooth-btle', spawnImpl, allowNonWindows: true });
  assert.equal(result.retryCount, 0);
});

test('runLiveBleInspector resets captureActive after failed capture', async () => {
  const crashImpl = () => {
    const child = new EventEmitter();
    child.kill = () => {};
    process.nextTick(() => child.emit('close', 1, null));
    return child;
  };
  const successImpl = () => {
    const child = new EventEmitter();
    child.kill = () => {};
    process.nextTick(() => child.emit('close', 0, null));
    return child;
  };

  await assert.rejects(
    runLiveBleInspector({ toolPath: 'ubertooth-btle', spawnImpl: crashImpl, allowNonWindows: true, retryDelayMs: 0 }),
    /UBT-CAP-002/
  );

  const result = await runLiveBleInspector({ toolPath: 'ubertooth-btle', spawnImpl: successImpl, allowNonWindows: true });
  assert.equal(result.retryCount, 0);
});

// --- PCAP export tests ---

test('buildLiveBleInspectorArgs adds -w flag for .pcap outputPath', () => {
  const result = buildLiveBleInspectorArgs({ outputPath: '/tmp/cap.pcap' });
  assert.ok(result.includes('-w'), 'should include -w flag');
  assert.ok(result.includes(path.resolve('/tmp/cap.pcap')), 'should include resolved path');
  assert.ok(!result.includes('-A'), 'should not include channel flag');
});

test('buildLiveBleInspectorArgs adds -w flag for .pcapng outputPath', () => {
  const result = buildLiveBleInspectorArgs({ outputPath: '/tmp/cap.pcapng' });
  assert.ok(result.includes('-w'));
  assert.ok(result.includes(path.resolve('/tmp/cap.pcapng')));
});

test('buildLiveBleInspectorArgs does not add -w for .txt outputPath', () => {
  assert.deepEqual(buildLiveBleInspectorArgs({ outputPath: '/tmp/cap.txt' }), ['-f']);
});

test('buildLiveBleInspectorArgs does not add -w when outputPath is null', () => {
  assert.deepEqual(buildLiveBleInspectorArgs({ outputPath: null }), ['-f']);
});

test('buildLiveBleInspectorArgs combines channel and -w for .pcap outputPath', () => {
  const result = buildLiveBleInspectorArgs({ channel: 37, outputPath: '/tmp/cap.pcap' });
  assert.deepEqual(result, ['-f', '-A', '37', '-w', path.resolve('/tmp/cap.pcap')]);
});

test('runLiveBleInspector passes -w to ubertooth-btle for .pcap output', async () => {
  const tmp = mkdtempSync(path.join(tmpdir(), 'pcap-test-'));
  const outFile = path.join(tmp, 'capture.pcap');
  try {
    let capturedArgs;
    const spawnImpl = (cmd, args) => {
      capturedArgs = args;
      const child = new EventEmitter();
      child.kill = () => {};
      process.nextTick(() => child.emit('close', 0, null));
      return child;
    };
    await runLiveBleInspector({
      toolPath: 'ubertooth-btle',
      outputPath: outFile,
      spawnImpl,
      allowNonWindows: true
    });
    assert.ok(capturedArgs.includes('-w'));
    assert.ok(capturedArgs.includes(path.resolve(outFile)));
  } finally {
    rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
});

test('runLiveBleInspector does not pipe stdout in PCAP mode', async () => {
  const tmp = mkdtempSync(path.join(tmpdir(), 'pcap-test-'));
  const outFile = path.join(tmp, 'capture.pcap');
  try {
    let spawnedStdio;
    const spawnImpl = (cmd, args, opts) => {
      spawnedStdio = opts.stdio;
      const child = new EventEmitter();
      child.kill = () => {};
      process.nextTick(() => child.emit('close', 0, null));
      return child;
    };
    await runLiveBleInspector({
      toolPath: 'ubertooth-btle',
      outputPath: outFile,
      spawnImpl,
      allowNonWindows: true
    });
    assert.notDeepEqual(spawnedStdio, ['ignore', 'pipe', 'inherit']);
  } finally {
    rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
});

test('runLiveBleInspector result includes outputFormat pcap for .pcap output', async () => {
  const tmp = mkdtempSync(path.join(tmpdir(), 'pcap-test-'));
  const outFile = path.join(tmp, 'capture.pcap');
  try {
    const spawnImpl = () => {
      const child = new EventEmitter();
      child.kill = () => {};
      process.nextTick(() => child.emit('close', 0, null));
      return child;
    };
    const result = await runLiveBleInspector({
      toolPath: 'ubertooth-btle',
      outputPath: outFile,
      spawnImpl,
      allowNonWindows: true
    });
    assert.equal(result.outputFormat, 'pcap');
    assert.equal(result.outputPath, path.resolve(outFile));
    assert.equal('bytesWritten' in result, false);
  } finally {
    rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
});

test('runLiveBleInspector result includes outputFormat text for .txt output', async () => {
  const tmp = mkdtempSync(path.join(tmpdir(), 'txt-format-test-'));
  const outFile = path.join(tmp, 'capture.txt');
  try {
    const result = await runLiveBleInspector({
      toolPath: 'ubertooth-btle',
      outputPath: outFile,
      spawnImpl: createPipedSpawnImpl(['hello\n']),
      allowNonWindows: true
    });
    assert.equal(result.outputFormat, 'text');
    assert.ok('bytesWritten' in result);
  } finally {
    rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
});

test('runLiveBleInspector PCAP output file written by mock tool has PCAP magic bytes', async () => {
  const tmp = mkdtempSync(path.join(tmpdir(), 'pcap-magic-test-'));
  const outFile = path.join(tmp, 'capture.pcap');
  const pcapMagic = Buffer.from([0xd4, 0xc3, 0xb2, 0xa1, 0x02, 0x00, 0x04, 0x00]);

  try {
    const spawnImpl = (cmd, args) => {
      const child = new EventEmitter();
      child.kill = () => {};
      const wIndex = args.indexOf('-w');
      if (wIndex !== -1) {
        writeFileSync(args[wIndex + 1], pcapMagic);
      }
      process.nextTick(() => child.emit('close', 0, null));
      return child;
    };

    await runLiveBleInspector({
      toolPath: 'ubertooth-btle',
      outputPath: outFile,
      spawnImpl,
      allowNonWindows: true
    });

    const content = readFileSync(outFile);
    assert.deepEqual(content.subarray(0, 4), Buffer.from([0xd4, 0xc3, 0xb2, 0xa1]));
  } finally {
    rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
});
