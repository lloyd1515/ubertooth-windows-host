import { runUbertoothExe } from '../ubertoothExeRunner.js';

export async function runDebug({ deviceIndex = null, register = null, verbose = false } = {}) {
  const extraArgs = [];
  if (deviceIndex !== null) {
    extraArgs.push('-U', deviceIndex.toString());
  }
  if (register !== null) {
    extraArgs.push('-r', register.toString());
  }
  if (verbose) {
    extraArgs.push('-v');
  }

  return runUbertoothExe({
    toolName: 'ubertooth-debug',
    extraArgs,
    stdio: 'inherit'
  });
}
