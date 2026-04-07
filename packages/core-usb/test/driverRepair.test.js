import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';

import { repairDevice, buildRepairArgs } from '../src/driverRepair.js';

test('buildRepairArgs returns correct flags for restart', () => {
  assert.deepEqual(buildRepairArgs('ID1', 'restart'), ['/restart-device', 'ID1']);
});

test('buildRepairArgs returns correct flags for remove', () => {
  assert.deepEqual(buildRepairArgs('ID1', 'remove'), ['/remove-device', 'ID1']);
});

test('buildRepairArgs returns correct flags for rescan', () => {
  assert.deepEqual(buildRepairArgs(null, 'rescan'), ['/scan-devices']);
});

test('repairDevice resolves on successful pnputil exit', async () => {
  const execFileImpl = async () => ({ stdout: 'Command completed successfully.' });
  const result = await repairDevice('ID1', { action: 'restart', execFileImpl, allowNonWindows: true });
  assert.equal(result.success, true);
  assert.match(result.stdout, /successfully/i);
});

test('repairDevice rejects on non-zero exit', async () => {
  const execFileImpl = async () => {
    const err = new Error('Command failed');
    err.code = 1;
    err.stdout = 'Failed to restart device.';
    throw err;
  };
  await assert.rejects(repairDevice('ID1', { action: 'restart', execFileImpl, allowNonWindows: true }), /UBT-DRV-001/);
});
