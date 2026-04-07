import { existsSync, createWriteStream, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUILD_CANDIDATES = [
  path.resolve(__dirname, '../../../build/windows-flash-tools'),
  path.resolve(__dirname, '../../../official-ubertooth-src/host/build-win-new/ubertooth-tools/src'),
  path.resolve(__dirname, '../../../official-ubertooth-src/host/build-windows/ubertooth-tools/src')
];

const TX_TOOLS = new Set(['ubertooth-tx', 'ubertooth-ducky']);
export const DUTY_CYCLE_LIMIT_SECONDS = 60; // 60 seconds per rolling hour
const DUTY_CYCLE_WINDOW_MS = 60 * 60 * 1000; // 1 hour window

const STATE_DIR = path.resolve(__dirname, '../../../../.beads/state');
const DUTY_CYCLE_FILE = path.join(STATE_DIR, 'duty-cycle.json');

export function getDutyCycleDataSync() {
  if (!existsSync(STATE_DIR)) {
    mkdirSync(STATE_DIR, { recursive: true });
  }
  if (!existsSync(DUTY_CYCLE_FILE)) {
    return { transmissions: [] };
  }
  try {
    return JSON.parse(readFileSync(DUTY_CYCLE_FILE, 'utf8'));
  } catch {
    return { transmissions: [] };
  }
}

function saveDutyCycleDataSync(data) {
  if (!existsSync(STATE_DIR)) {
    mkdirSync(STATE_DIR, { recursive: true });
  }
  writeFileSync(DUTY_CYCLE_FILE, JSON.stringify(data, null, 2));
}

function isTxCommand(toolName, extraArgs) {
  const isBtleTx = toolName === 'ubertooth-btle' && extraArgs.some(arg => 
    arg === '-i' || arg === '-I' || arg.startsWith('-s')
  );
  return TX_TOOLS.has(toolName) || isBtleTx;
}

export function findUbertoothExe(toolName) {
  for (const dir of BUILD_CANDIDATES) {
    const candidate = path.join(dir, `${toolName}.exe`);
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return toolName;
}

export function checkHardwareSafety(toolName, extraArgs = []) {
  if (isTxCommand(toolName, extraArgs)) {
    const bypassFile = path.resolve(__dirname, '../../../.antenna_attached');
    const hasBypassArg = extraArgs.includes('--i-confirm-antenna-is-attached');
    
    if (!existsSync(bypassFile) && !hasBypassArg) {
      throw new Error(`HARDWARE-SAFETY-BLOCK: '${toolName}' is a transmission tool. To prevent permanent RF front-end damage, you MUST have an antenna attached and confirm it by adding '--i-confirm-antenna-is-attached' to your command or creating a '.antenna_attached' file in the project root.`);
    }

    const now = Date.now();
    const data = getDutyCycleDataSync();
    const windowStart = now - DUTY_CYCLE_WINDOW_MS;
    
    // Cleanup old transmissions
    data.transmissions = data.transmissions.filter(tx => tx.timestamp > windowStart);
    
    const currentUsageSeconds = data.transmissions.reduce((sum, tx) => sum + tx.durationSeconds, 0);
    
    if (currentUsageSeconds >= DUTY_CYCLE_LIMIT_SECONDS) {
      throw new Error(`HARDWARE-SAFETY-BLOCK: Duty-cycle limit exceeded. You have used ${currentUsageSeconds.toFixed(1)}s of transmission time in the last hour (limit: ${DUTY_CYCLE_LIMIT_SECONDS}s). Please wait before further transmission to prevent thermal overload.`);
    }
    
    // Save cleaned data
    saveDutyCycleDataSync(data);
  }
}

export function buildExeArgs({ extraArgs = [], outputPath = null } = {}) {
  const args = extraArgs.filter(arg => arg !== '--i-confirm-antenna-is-attached');
  return args;
}

export function runUbertoothExe({
  toolName,
  extraArgs = [],
  outputPath = null,
  timeoutSeconds = null,
  spawnImpl = spawn,
  stdio = 'inherit',
  windowsHide = true,
  allowNonWindows = false,
  platform = process.platform
} = {}) {
  if (platform !== 'win32' && !allowNonWindows) {
    return Promise.reject(new Error(`${toolName} is only supported on Windows hosts.`));
  }

  try {
    checkHardwareSafety(toolName, extraArgs);
  } catch (err) {
    return Promise.reject(err);
  }

  const executable = findUbertoothExe(toolName);
  const resolvedOutputPath = outputPath ? path.resolve(outputPath) : null;
  const args = buildExeArgs({ extraArgs, outputPath: resolvedOutputPath });
  const useFileExport = resolvedOutputPath != null;
  const childStdio = useFileExport ? ['ignore', 'pipe', 'inherit'] : stdio;

  const isTx = isTxCommand(toolName, extraArgs);
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    let timedOut = false;
    let timer = null;
    let bytesWritten = 0;
    let fileStream = null;

    const child = spawnImpl(executable, args, { stdio: childStdio, windowsHide });

    if (useFileExport) {
      fileStream = createWriteStream(resolvedOutputPath);
      fileStream.on('error', (err) => {
        cleanup();
        child.kill();
        reject(new Error(`${toolName} file write failed: ${err.message}`));
      });
      child.stdout.on('data', (chunk) => {
        bytesWritten += chunk.length;
        process.stdout.write(chunk);
        fileStream.write(chunk);
      });
    }

    if (timeoutSeconds) {
      timer = setTimeout(() => {
        timedOut = true;
        child.kill();
      }, timeoutSeconds * 1000);
    }

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      
      if (isTx) {
        const durationSeconds = (Date.now() - startTime) / 1000;
        const data = getDutyCycleDataSync();
        data.transmissions.push({
          timestamp: startTime,
          durationSeconds: durationSeconds,
          tool: toolName
        });
        saveDutyCycleDataSync(data);
      }
    };

    const finish = (fields) => {
      if (!fileStream) {
        resolve(fields);
        return;
      }
      fileStream.end(() => resolve(fields));
    };

    child.once('error', (err) => {
      cleanup();
      if (fileStream) fileStream.end();
      if (err?.code === 'ENOENT') {
        reject(new Error(`UBT-EXE-NOTFOUND: ${toolName} executable not found at '${executable}'.`));
        return;
      }
      reject(err);
    });

    child.once('close', (code, signal) => {
      cleanup();

      if (timedOut) {
        finish({ executable, args, exitCode: code, signal, timedOut: true, outputPath: resolvedOutputPath, bytesWritten });
        return;
      }

      if (code === 0) {
        finish({ executable, args, exitCode: code, signal, timedOut: false, outputPath: resolvedOutputPath, bytesWritten: useFileExport ? bytesWritten : undefined });
        return;
      }

      if (fileStream) fileStream.end();
      reject(new Error(`UBT-EXE-001: ${toolName} exited unexpectedly (code ${code ?? 'null'}).`));
    });
  });
}
