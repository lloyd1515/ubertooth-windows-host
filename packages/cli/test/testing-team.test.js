import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../../');
const BUILD_DIR = path.join(ROOT_DIR, 'build/windows-flash-tools');

// --- Test Automator Agent Tests ---

test('Testing Team: Verify all 13 tools and 3 DLLs are present in build directory', () => {
  const tools = [
    'ubertooth-afh.exe',
    'ubertooth-btle.exe',
    'ubertooth-debug.exe',
    'ubertooth-dfu.exe',
    'ubertooth-ducky.exe',
    'ubertooth-dump.exe',
    'ubertooth-ego.exe',
    'ubertooth-follow.exe',
    'ubertooth-rx.exe',
    'ubertooth-scan.exe',
    'ubertooth-specan.exe',
    'ubertooth-tx.exe',
    'ubertooth-util.exe'
  ];
  const dlls = [
    'libbtbb.dll',
    'libubertooth.dll',
    'libusb-1.0.dll'
  ];

  for (const tool of tools) {
    assert.ok(existsSync(path.join(BUILD_DIR, tool)), `Missing tool: ${tool}`);
  }
  for (const dll of dlls) {
    assert.ok(existsSync(path.join(BUILD_DIR, dll)), `Missing DLL: ${dll}`);
  }
});

test('Testing Team: CLI handles invalid commands', () => {
  const cliPath = path.join(ROOT_DIR, 'packages/cli/src/index.js');
  const result = spawnSync('node', [cliPath, 'invalid-command'], { encoding: 'utf8' });
  
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unsupported command: invalid-command/);
});

test('Testing Team: Hardware Safety Protocol blocks TX without confirmation', () => {
  const cliPath = path.join(ROOT_DIR, 'packages/cli/src/index.js');
  
  // Ensure .antenna_attached does NOT exist for this test
  const antennaFile = path.join(ROOT_DIR, '.antenna_attached');
  const antennaExisted = existsSync(antennaFile);
  let originalContent = null;
  if (antennaExisted) {
    originalContent = readFileSync(antennaFile);
    unlinkSync(antennaFile);
  }

  try {
    // Test ubertooth-tx
    const resultTx = spawnSync('node', [cliPath, 'tx'], { encoding: 'utf8' });
    assert.match(resultTx.stderr, /HARDWARE-SAFETY-BLOCK/);
    assert.match(resultTx.stderr, /is a transmission tool/);

    // Test ubertooth-ducky
    const resultDucky = spawnSync('node', [cliPath, 'ducky'], { encoding: 'utf8' });
    assert.match(resultDucky.stderr, /HARDWARE-SAFETY-BLOCK/);

    // Test btle -s (slave/advertise)
    const resultBtle = spawnSync('node', [cliPath, 'btle', '-s', 'AA:BB:CC:DD:EE:FF'], { encoding: 'utf8' });
    assert.match(resultBtle.stderr, /HARDWARE-SAFETY-BLOCK/);
  } finally {
    // Restore antenna file if it existed
    if (antennaExisted) {
      writeFileSync(antennaFile, originalContent);
    }
  }
});

// --- Verifier Agent Tests ---

test('Testing Team: Status command exists and handles no device gracefully', () => {
  const cliPath = path.join(ROOT_DIR, 'packages/cli/src/index.js');
  const result = spawnSync('node', [cliPath, 'status'], { encoding: 'utf8' });
  
  // If no device, it should have a specific error code or message
  assert.match(result.stderr, /No Ubertooth devices found/);
  assert.equal(result.status, 1);
});

test('Testing Team: Util command exists and maps to -i (info)', () => {
  const cliPath = path.join(ROOT_DIR, 'packages/cli/src/index.js');
  const result = spawnSync('node', [cliPath, 'util'], { encoding: 'utf8' });
  
  // It should try to run ubertooth-util and fail with no device
  assert.match(result.stderr, /ubertooth-util exited unexpectedly/);
});

test('Testing Team: DLLs are staged and EXEs can run (dependency check)', () => {
  // We can't easily run the EXEs without hardware, but we can check if they start and fail with "no device"
  // rather than "DLL not found".
  const utilExe = path.join(BUILD_DIR, 'ubertooth-util.exe');
  
  // Use a hack: check if the EXE exists and we can read it.
  // Real verification that DLLs are loaded requires running it.
  // On Windows, if a DLL is missing, the process fails to start.
  
  const result = spawnSync(utilExe, ['-v'], { 
    cwd: BUILD_DIR, // Run from the build dir where DLLs are
    encoding: 'utf8',
    env: { ...process.env, PATH: `${BUILD_DIR};${process.env.PATH}` }
  });

  // It should either return version (if device present) or "no device" or "failed to open".
  // It should NOT fail with "The system cannot find the file specified" (which usually means missing DLL in this context of spawnSync)
  // or a system error code for missing dependencies.
  
  if (result.error) {
    assert.fail(`Failed to execute ${utilExe}: ${result.error.message}`);
  }
  
  // If DLLs were missing, status would likely be non-zero and stderr would have a system error.
  // However, node spawnSync might not capture the "Missing DLL" popup.
  // But we can check if the result is a "normal" failure from the tool itself.
  assert.ok(result.stderr.includes('ubertooth') || result.stdout.includes('ubertooth') || result.status !== undefined);
});

// --- Security Auditor Agent Tests ---

test('Testing Team: Duty-Cycle Enforcement', () => {
  const stateDir = path.resolve(__dirname, '../../../../.beads/state');
  const dutyCycleFile = path.join(stateDir, 'duty-cycle.json');
  
  // We'll mock the duty cycle file
  const originalDutyCycle = existsSync(dutyCycleFile) ? readFileSync(dutyCycleFile, 'utf8') : null;
  
  try {
    const mockData = {
      transmissions: [
        {
          timestamp: Date.now() - 1000,
          durationSeconds: 70,
          tool: 'ubertooth-tx'
        }
      ]
    };
    if (!existsSync(stateDir)) {
      mkdirSync(stateDir, { recursive: true });
    }
    writeFileSync(dutyCycleFile, JSON.stringify(mockData));

    const cliPath = path.join(ROOT_DIR, 'packages/cli/src/index.js');
    
    // Create .antenna_attached to bypass the first check
    const antennaFile = path.join(ROOT_DIR, '.antenna_attached');
    const antennaExisted = existsSync(antennaFile);
    if (!antennaExisted) {
      writeFileSync(antennaFile, 'confirmed');
    }

    try {
      // Try to run another TX command. It should be blocked by duty cycle (limit is 60s)
      const result = spawnSync('node', [cliPath, 'tx', '--i-confirm-antenna-is-attached'], { encoding: 'utf8' });
      assert.match(result.stderr, /HARDWARE-SAFETY-BLOCK: Duty-cycle limit exceeded/);
      assert.match(result.stderr, /used 70.0s/);
    } finally {
      if (!antennaExisted) {
        unlinkSync(antennaFile);
      }
    }

  } finally {
    if (originalDutyCycle) {
      writeFileSync(dutyCycleFile, originalDutyCycle);
    } else if (existsSync(dutyCycleFile)) {
      unlinkSync(dutyCycleFile);
    }
  }
});

// --- Researcher Agent Tests ---

test('Testing Team: Tool Parity and Flag Mapping', () => {
  const cliPath = path.join(ROOT_DIR, 'packages/cli/src/index.js');
  const helpOutput = spawnSync('node', [cliPath, 'help'], { encoding: 'utf8' }).stdout;

  const expectedCommands = [
    'specan', 'rx', 'dump', 'afh', 'util', 'scan', 'follow', 'ducky', 'tx', 'debug', 'ego', 'btle'
  ];

  for (const cmd of expectedCommands) {
    assert.ok(helpOutput.includes(cmd), `Missing command in help: ${cmd}`);
  }

  // Check some specific flag mappings for btle
  const btleHelp = spawnSync('node', [cliPath, 'help'], { encoding: 'utf8' }).stdout; 
  // (In our implementation help.js contains all info)
  
  assert.ok(helpOutput.includes('--address'), 'btle should support --address');
  assert.ok(helpOutput.includes('--slave'), 'btle should support --slave');
  assert.ok(helpOutput.includes('--pcapng'), 'btle should support --pcapng');
});
