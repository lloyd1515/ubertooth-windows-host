import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeFlashProcessResult,
  performOfficialFlash,
  runOfficialFlash,
  validateFlashInput
} from '../src/flashDevice.js';

test('validateFlashInput requires a .dfu file', async () => {
  await assert.rejects(
    () => validateFlashInput('firmware.bin', {
      statImpl: async () => ({ isFile: () => true })
    }),
    /must use the \.dfu extension/i
  );
});

test('normalizeFlashProcessResult detects official reset warnings', () => {
  const result = normalizeFlashProcessResult({
    ok: false,
    stdout: 'Switching to DFU mode...\nChecking firmware signature',
    stderr: 'control message unsupported'
  });

  assert.equal(result.switchedToDfu, true);
  assert.equal(result.signatureCheckObserved, true);
  assert.equal(result.resetIssueDetected, true);
});

test('runOfficialFlash surfaces missing official tooling clearly', async () => {
  await assert.rejects(
    () => runOfficialFlash({
      firmwarePath: 'x.dfu',
      execFileImpl: async () => {
        const error = new Error('spawn ENOENT');
        error.code = 'ENOENT';
        throw error;
      }
    }),
    /official ubertooth-dfu executable/i
  );
});

test('performOfficialFlash waits for the device to reappear after the official tool succeeds', async () => {
  const states = [
    [{ pnpDeviceId: 'device-1', transportReadiness: { readyForReadOnlyWinUsbExperiment: true }, name: 'Ubertooth One' }],
    [],
    [{ pnpDeviceId: 'device-1', transportReadiness: { readyForReadOnlyWinUsbExperiment: true }, name: 'Ubertooth One', status: 'OK' }]
  ];
  const probeDevices = async () => states.shift() ?? [];
  const readProtocolInfo = async () => ([{
    pnpDeviceId: 'device-1',
    protocolInfo: { parsed: { firmwareRevision: '2020-12-R1', apiVersion: { formatted: '1.07' } } }
  }]);
  const execFileImpl = async () => ({ stdout: 'Switching to DFU mode...\nChecking firmware signature\n', stderr: '' });

  const result = await performOfficialFlash({
    firmwarePath: 'bluetooth_rxtx.dfu',
    statImpl: async () => ({ isFile: () => true }),
    probeDevices,
    readProtocolInfo,
    execFileImpl,
    allowNonWindows: true,
    reconnectTimeoutMs: 1200,
    pollIntervalMs: 10,
    skipInitialSleep: true
  });

  assert.equal(result.successful, true);
  assert.equal(result.recoveryRequired, false);
  assert.equal(result.preFlashProtocolEntry.protocolInfo.parsed.firmwareRevision, '2020-12-R1');
  assert.equal(result.postFlash.pnpDeviceId, 'device-1');
});

test('performOfficialFlash returns a recovery-required result when the official tool reports reset trouble', async () => {
  const probeDevices = async () => ([{ pnpDeviceId: 'device-1', transportReadiness: { readyForReadOnlyWinUsbExperiment: true }, name: 'Ubertooth One' }]);
  const readProtocolInfo = async () => ([]);
  const execFileImpl = async () => {
    const error = new Error('control message unsupported');
    error.code = 1;
    error.stderr = 'control message unsupported';
    error.stdout = 'Checking firmware signature';
    throw error;
  };

  const result = await performOfficialFlash({
    firmwarePath: 'bluetooth_rxtx.dfu',
    statImpl: async () => ({ isFile: () => true }),
    probeDevices,
    readProtocolInfo,
    execFileImpl,
    allowNonWindows: true
  });

  assert.equal(result.successful, false);
  assert.equal(result.recoveryRequired, true);
  assert.equal(result.dispatch.resetIssueDetected, true);
});
