import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function runTextCommand(command, args, {
  execFileImpl = execFileAsync,
  timeoutMs = 10000,
  windowsHide = true,
  allowNonWindows = false
} = {}) {
  if (process.platform !== 'win32' && !allowNonWindows) {
    throw new Error(`${command} command execution is only supported on Windows hosts.`);
  }

  const result = await execFileImpl(command, args, {
    windowsHide,
    timeout: timeoutMs,
    maxBuffer: 1024 * 1024
  });

  return String(typeof result === 'string' ? result : result.stdout ?? '').trim();
}
