import { execFile } from 'node:child_process';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { getReadOnlyProtocolInfo } from './readOnlyProtocolInfo.js';
import { probeUbertoothDevices } from './windowsPnpProbe.js';

const execFileAsync = promisify(execFile);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toText(value) {
  return String(value ?? '').trim();
}

export async function validateFlashInput(firmwarePath, {
  statImpl = stat
} = {}) {
  if (!firmwarePath) {
    throw new Error('Flash guardrail failed: --file is required and must point to an official .dfu image.');
  }

  const resolvedPath = path.resolve(firmwarePath);
  let fileStats;
  try {
    fileStats = await statImpl(resolvedPath);
  } catch {
    throw new Error(`Flash guardrail failed: firmware image was not found at '${resolvedPath}'.`);
  }

  if (!fileStats.isFile()) {
    throw new Error(`Flash guardrail failed: firmware image path '${resolvedPath}' is not a file.`);
  }

  if (path.extname(resolvedPath).toLowerCase() !== '.dfu') {
    throw new Error(`Flash guardrail failed: firmware image '${resolvedPath}' must use the .dfu extension.`);
  }

  return {
    firmwarePath: resolvedPath,
    fileName: path.basename(resolvedPath)
  };
}

export function normalizeFlashProcessResult(payload = {}) {
  const stdout = toText(payload.stdout);
  const stderr = toText(payload.stderr);
  const combined = `${stdout}\n${stderr}`;

  return {
    ok: payload.ok !== false,
    exitCode: typeof payload.exitCode === 'number' ? payload.exitCode : null,
    signal: payload.signal ?? null,
    stdout,
    stderr,
    errorCode: payload.errorCode ?? null,
    errorMessage: toText(payload.errorMessage),
    switchedToDfu: /Switching to DFU mode/i.test(combined),
    signatureCheckObserved: /Checking firmware signature/i.test(combined),
    resetIssueDetected: /control message unsupported/i.test(combined)
  };
}

export async function runOfficialFlash({
  execFileImpl = execFileAsync,
  flashExecutable = 'ubertooth-dfu',
  firmwarePath,
  flashTimeoutMs = 120000
} = {}) {
  try {
    const result = await execFileImpl(flashExecutable, ['-d', firmwarePath, '-r'], {
      windowsHide: true,
      timeout: flashTimeoutMs,
      maxBuffer: 4 * 1024 * 1024
    });

    return normalizeFlashProcessResult({
      ok: true,
      exitCode: 0,
      stdout: typeof result === 'string' ? result : result.stdout,
      stderr: typeof result === 'string' ? '' : result.stderr
    });
  } catch (error) {
    const normalized = normalizeFlashProcessResult({
      ok: false,
      exitCode: typeof error?.code === 'number' ? error.code : null,
      signal: error?.signal ?? null,
      stdout: error?.stdout,
      stderr: error?.stderr,
      errorCode: typeof error?.code === 'string' ? error.code : null,
      errorMessage: error?.message
    });

    if (normalized.errorCode === 'ENOENT') {
      throw new Error(`Flash guardrail failed: official ubertooth-dfu executable '${flashExecutable}' was not found on PATH.`);
    }

    if (!normalized.resetIssueDetected) {
      throw new Error(`Official flash failed: ${normalized.stderr || normalized.stdout || normalized.errorMessage || 'ubertooth-dfu exited unexpectedly.'}`);
    }

    return normalized;
  }
}

export async function performOfficialFlash({
  firmwarePath,
  probeDevices = probeUbertoothDevices,
  readProtocolInfo = getReadOnlyProtocolInfo,
  statImpl,
  execFileImpl,
  flashExecutable = 'ubertooth-dfu',
  powershellExecutable = 'powershell.exe',
  timeoutMs = 10000,
  flashTimeoutMs = 120000,
  reconnectTimeoutMs = 30000,
  pollIntervalMs = 1000,
  allowNonWindows = false,
  skipInitialSleep = false
} = {}) {
  const firmware = await validateFlashInput(firmwarePath, { statImpl });
  const preFlashDevices = await probeDevices({ execFileImpl, powershellExecutable, timeoutMs, allowNonWindows });

  if (preFlashDevices.length !== 1) {
    throw new Error('Flash guardrail failed: flash currently requires exactly one connected Ubertooth device.');
  }

  const target = preFlashDevices[0];
  if (!target.transportReadiness?.readyForReadOnlyWinUsbExperiment) {
    throw new Error('Flash guardrail failed: device is not ready for official flashing. Run probe and clear transport blockers first.');
  }

  const protocolEntries = await readProtocolInfo({ execFileImpl, powershellExecutable, timeoutMs, allowNonWindows });
  const preFlashProtocolEntry = protocolEntries.find((entry) => entry.pnpDeviceId === target.pnpDeviceId)
    ?? (protocolEntries.length === 1 ? protocolEntries[0] : null);

  const dispatch = await runOfficialFlash({
    execFileImpl,
    flashExecutable,
    firmwarePath: firmware.firmwarePath,
    flashTimeoutMs
  });

  if (dispatch.resetIssueDetected) {
    return {
      preFlash: target,
      preFlashProtocolEntry,
      firmware,
      flashExecutable,
      dispatch,
      successful: false,
      recoveryRequired: true,
      elapsedMs: 0,
      pollCount: 0,
      postFlash: null
    };
  }

  const startedAt = Date.now();
  let reappeared = false;
  let postFlash = null;
  let pollCount = 0;

  // Adaptive polling: start with a small delay for reboot, then poll frequently, then back off.
  if (!skipInitialSleep) {
    await sleep(1500); 
  }

  while ((Date.now() - startedAt) < reconnectTimeoutMs) {
    pollCount += 1;
    const devices = await probeDevices({ execFileImpl, powershellExecutable, timeoutMs, allowNonWindows });
    const matching = devices.find((entry) => entry.pnpDeviceId === target.pnpDeviceId)
      ?? (devices.length === 1 ? devices[0] : null);

    if (matching?.transportReadiness?.readyForReadOnlyWinUsbExperiment) {
      reappeared = true;
      postFlash = matching;
      break;
    }

    // Adaptive interval: 200ms for the first 5s, then 500ms, then 1s backoff.
    const elapsed = Date.now() - startedAt;
    const nextInterval = elapsed < 5000 ? 200 : (elapsed < 15000 ? 500 : 1000);
    await sleep(nextInterval);
  }

  return {
    preFlash: target,
    preFlashProtocolEntry,
    firmware,
    flashExecutable,
    dispatch,
    successful: reappeared,
    recoveryRequired: false,
    elapsedMs: Date.now() - startedAt,
    pollCount,
    postFlash
  };
}
