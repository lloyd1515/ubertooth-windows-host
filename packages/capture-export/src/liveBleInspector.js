import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_REPO_LOCAL_TOOL = path.resolve(
  __dirname,
  '../../../official-ubertooth-src/host/build-windows/ubertooth-tools/src/ubertooth-btle.exe'
);

export function getDefaultLiveBleToolPath() {
  return existsSync(DEFAULT_REPO_LOCAL_TOOL) ? DEFAULT_REPO_LOCAL_TOOL : 'ubertooth-btle';
}

export function normalizeCaptureChannel(channel) {
  if (channel == null) {
    return null;
  }

  const normalized = String(channel).trim();
  if (!['37', '38', '39'].includes(normalized)) {
    throw new Error(`Capture guardrail failed: --channel must be one of 37, 38, or 39 (received '${channel}').`);
  }

  return normalized;
}

export function normalizeTimeoutSeconds(timeoutSeconds) {
  if (timeoutSeconds == null) {
    return null;
  }

  const normalized = Number(timeoutSeconds);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    throw new Error(`Capture guardrail failed: --timeout-seconds must be a positive number (received '${timeoutSeconds}').`);
  }

  return normalized;
}

export function buildLiveBleInspectorArgs({ channel = null } = {}) {
  const normalizedChannel = normalizeCaptureChannel(channel);
  const args = ['-f'];
  if (normalizedChannel) {
    args.push('-A', normalizedChannel);
  }
  return args;
}

function buildInspectorResult({ executable, args, timeoutSeconds, exitCode, signal, timedOut }) {
  return {
    executable,
    args,
    timedOut,
    timeoutSeconds,
    exitCode,
    signal
  };
}

export async function runLiveBleInspector({
  toolPath,
  channel = null,
  timeoutSeconds = null,
  spawnImpl = spawn,
  stdio = 'inherit',
  windowsHide = true,
  allowNonWindows = false
} = {}) {
  if (process.platform !== 'win32' && !allowNonWindows) {
    throw new Error('Live BLE capture is only supported on Windows hosts.');
  }

  const executable = toolPath ? path.resolve(toolPath) : getDefaultLiveBleToolPath();
  const args = buildLiveBleInspectorArgs({ channel });
  const normalizedTimeoutSeconds = normalizeTimeoutSeconds(timeoutSeconds);

  return new Promise((resolve, reject) => {
    let timedOut = false;
    let timer = null;

    const child = spawnImpl(executable, args, {
      stdio,
      windowsHide
    });

    if (normalizedTimeoutSeconds) {
      timer = setTimeout(() => {
        timedOut = true;
        child.kill();
      }, normalizedTimeoutSeconds * 1000);
    }

    const cleanup = () => {
      if (timer) {
        clearTimeout(timer);
      }
    };

    child.once('error', (error) => {
      cleanup();
      if (error?.code === 'ENOENT') {
        reject(new Error(`Capture guardrail failed: official ubertooth-btle executable '${executable}' was not found.`));
        return;
      }
      reject(error);
    });

    child.once('close', (code, signal) => {
      cleanup();
      if (timedOut) {
        resolve(buildInspectorResult({
          executable,
          args,
          timeoutSeconds: normalizedTimeoutSeconds,
          exitCode: code,
          signal,
          timedOut: true
        }));
        return;
      }

      if (code === 0) {
        resolve(buildInspectorResult({
          executable,
          args,
          timeoutSeconds: normalizedTimeoutSeconds,
          exitCode: code,
          signal,
          timedOut: false
        }));
        return;
      }

      reject(new Error(`Live BLE capture failed: ubertooth-btle exited with code ${code ?? 'null'}${signal ? ` (signal: ${signal})` : ''}.`));
    });
  });
}
