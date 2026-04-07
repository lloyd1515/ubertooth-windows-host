import { existsSync, createWriteStream } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_REPO_LOCAL_TOOL = path.resolve(
  __dirname,
  '../../../official-ubertooth-src/host/build-windows/ubertooth-tools/src/ubertooth-btle.exe'
);

let captureActive = false;

export function getDefaultLiveBleToolPath() {
  return existsSync(DEFAULT_REPO_LOCAL_TOOL) ? DEFAULT_REPO_LOCAL_TOOL : 'ubertooth-btle';
}

export function normalizeCaptureChannel(channel) {
  if (channel == null) {
    return null;
  }

  const normalized = Number(channel);
  if (!Number.isInteger(normalized) || normalized < 0 || normalized > 78) {
    throw new Error(`Capture guardrail failed: --channel must be between 0 and 78 (received '${channel}').`);
  }

  return String(normalized);
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

function isPcapPath(outputPath) {
  if (!outputPath) return false;
  const ext = path.extname(outputPath).toLowerCase();
  return ext === '.pcap' || ext === '.pcapng';
}

export function buildLiveBleInspectorArgs({
  channel = null,
  outputPath = null,
  rssi = false,
  follow = false,
  target = null,
  interval = null
} = {}) {
  const normalizedChannel = normalizeCaptureChannel(channel);
  const args = ['-f'];
  if (normalizedChannel) {
    args.push('-A', normalizedChannel);
  }
  if (rssi) {
    args.push('-r');
  }
  if (follow) {
    args.push('-C');
  }
  if (target) {
    args.push('-t', String(target));
  }
  if (interval) {
    args.push('-i', String(interval));
  }
  if (isPcapPath(outputPath)) {
    args.push('-w', path.resolve(outputPath));
  }
  return args;
}

export function validateOutputPath(outputPath) {
  if (outputPath == null) {
    return null;
  }

  const resolved = path.resolve(outputPath);
  const parentDir = path.dirname(resolved);
  if (!existsSync(parentDir)) {
    throw new Error(`Capture guardrail failed: output directory '${parentDir}' does not exist.`);
  }

  return resolved;
}

function buildInspectorResult({ executable, args, timeoutSeconds, exitCode, signal, timedOut, outputPath, bytesWritten, outputFormat }) {
  const result = {
    executable,
    args,
    timedOut,
    timeoutSeconds,
    exitCode,
    signal
  };

  if (outputPath != null) {
    result.outputPath = outputPath;
    result.outputFormat = outputFormat;
    if (outputFormat === 'text') {
      result.bytesWritten = bytesWritten;
    }
  }

  return result;
}

function attemptCapture({ executable, args, normalizedTimeoutSeconds, resolvedOutputPath, isPcap, outputFormat, spawnImpl, stdio, windowsHide }) {
  const useFileExport = resolvedOutputPath != null && !isPcap;
  const childStdio = useFileExport ? ['ignore', 'pipe', 'pipe'] : [stdio === 'inherit' ? 'ignore' : 'pipe', 'pipe', 'pipe'];

  return new Promise((resolve, reject) => {
    let timedOut = false;
    let timer = null;
    let bytesWritten = 0;
    let fileStream = null;
    let stderrBuffer = '';

    const child = spawnImpl(executable, args, {
      stdio: childStdio,
      windowsHide
    });

    if (child.stderr) {
      child.stderr.on('data', (chunk) => {
        stderrBuffer += chunk.toString();
      });
    }

    if (useFileExport) {
      fileStream = createWriteStream(resolvedOutputPath);
      fileStream.on('error', (err) => {
        cleanup();
        child.kill();
        reject(new Error(`Capture file write failed: ${err.message}${stderrBuffer ? ` | Stderr: ${stderrBuffer}` : ''}`));
      });
      child.stdout.on('data', (chunk) => {
        bytesWritten += chunk.length;
        process.stdout.write(chunk);
        fileStream.write(chunk);
      });
    } else if (child.stdout) {
      child.stdout.on('data', (chunk) => {
        process.stdout.write(chunk);
      });
    }

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

    const finishWithFile = (resultFields) => {
      if (!fileStream) {
        resolve(buildInspectorResult(resultFields));
        return;
      }

      fileStream.end(() => {
        resolve(buildInspectorResult(resultFields));
      });
    };

    child.once('error', (error) => {
      cleanup();
      if (fileStream) {
        fileStream.end();
      }
      if (error?.code === 'ENOENT') {
        reject(new Error(`UBT-CAP-NOTFOUND: ubertooth-btle executable not found at '${executable}'.`));
        return;
      }
      reject(error);
    });

    child.once('close', (code, signal) => {
      cleanup();
      if (timedOut) {
        finishWithFile({
          executable,
          args,
          timeoutSeconds: normalizedTimeoutSeconds,
          exitCode: code,
          signal,
          timedOut: true,
          outputPath: resolvedOutputPath,
          bytesWritten,
          outputFormat
        });
        return;
      }

      if (code === 0) {
        finishWithFile({
          executable,
          args,
          timeoutSeconds: normalizedTimeoutSeconds,
          exitCode: code,
          signal,
          timedOut: false,
          outputPath: resolvedOutputPath,
          bytesWritten,
          outputFormat
        });
        return;
      }

      if (fileStream) {
        fileStream.end();
      }
      const cleanStderr = stderrBuffer.trim();
      const err = new Error(`UBT-CAP-001: ubertooth-btle exited unexpectedly (code ${code ?? 'null'})${cleanStderr ? `. Stderr: ${cleanStderr}` : ''}`);
      err.retryable = true;
      err.exitCode = code;
      err.stderr = cleanStderr;
      reject(err);
    });
  });
}

export async function runLiveBleInspector({
  toolPath,
  channel = null,
  timeoutSeconds = null,
  outputPath = null,
  rssi = false,
  follow = false,
  target = null,
  interval = null,
  spawnImpl = spawn,
  stdio = 'inherit',
  windowsHide = true,
  allowNonWindows = false,
  retryDelayMs = 1000,
  maxRetries = 3
} = {}) {
  if (process.platform !== 'win32' && !allowNonWindows) {
    throw new Error('Live BLE capture is only supported on Windows hosts.');
  }

  if (captureActive) {
    throw new Error('UBT-CAP-BUSY: a capture is already active.');
  }
  captureActive = true;

  const executable = toolPath ? path.resolve(toolPath) : getDefaultLiveBleToolPath();
  const normalizedTimeoutSeconds = normalizeTimeoutSeconds(timeoutSeconds);
  const resolvedOutputPath = validateOutputPath(outputPath);
  const isPcap = isPcapPath(resolvedOutputPath);
  const args = buildLiveBleInspectorArgs({ channel, outputPath: resolvedOutputPath, rssi, follow, target, interval });
  const outputFormat = resolvedOutputPath != null ? (isPcap ? 'pcap' : 'text') : undefined;

  const derived = { executable, args, normalizedTimeoutSeconds, resolvedOutputPath, isPcap, outputFormat, spawnImpl, stdio, windowsHide };

  let retryCount = 0;
  let lastStderr = '';
  try {
    while (true) {
      try {
        const result = await attemptCapture(derived);
        return { ...result, retryCount };
      } catch (err) {
        if (err.stderr) {
          lastStderr = err.stderr;
        }
        if (err.retryable && retryCount < maxRetries) {
          retryCount++;
          await new Promise(r => setTimeout(r, retryDelayMs));
        } else {
          if (err.retryable) {
            throw new Error(`UBT-CAP-002: process crashed ${retryCount + 1} times. Last exit code: ${err.exitCode ?? 'unknown'}.${lastStderr ? ` Last stderr: ${lastStderr}` : ''}`);
          }
          throw err;
        }
      }
    }
  } finally {
    captureActive = false;
  }
}
