import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../../');
const SCRIPT_PATH = path.join(ROOT_DIR, 'scripts/setup-windows-flash-tools.ps1');

test('setup-windows-flash-tools can restage artifacts from the staged flash-tools directory', () => {
  const stageDir = mkdtempSync(path.join(tmpdir(), 'ubertooth-flash-tools-'));

  try {
    const result = spawnSync(
      'powershell',
      ['-ExecutionPolicy', 'Bypass', '-File', SCRIPT_PATH, '-StageDir', stageDir, '-Json'],
      { cwd: ROOT_DIR, encoding: 'utf8' }
    );

    assert.equal(result.status, 0, result.stderr || result.stdout);
    const manifest = JSON.parse(result.stdout);

    assert.equal(manifest.stageDir, stageDir);
    assert.match(manifest.toolSourceDir, /build[\\/]windows-flash-tools$/i);
    assert.ok(existsSync(manifest.stagedToolPaths.ubertoothDfu));
    assert.ok(existsSync(manifest.stagedToolPaths.ubertoothUtil));
    assert.ok(existsSync(manifest.stagedToolPaths.libusb));
  } finally {
    rmSync(stageDir, { recursive: true, force: true });
  }
});
