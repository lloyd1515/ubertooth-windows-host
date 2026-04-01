import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function runPowerShellJson(script, {
  execFileImpl = execFileAsync,
  powershellExecutable = 'powershell.exe',
  timeoutMs = 10000,
  allowNonWindows = false
} = {}) {
  if (process.platform !== 'win32' && !allowNonWindows) {
    throw new Error('PowerShell-backed hardware discovery is only supported on Windows hosts.');
  }

  const result = await execFileImpl(powershellExecutable, ['-NoProfile', '-Command', script], {
    windowsHide: true,
    timeout: timeoutMs,
    maxBuffer: 1024 * 1024
  });

  const stdout = typeof result === 'string' ? result : result.stdout;
  return String(stdout ?? '').trim();
}
