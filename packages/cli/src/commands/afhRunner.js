import { runUbertoothExe } from '../ubertoothExeRunner.js';

export function buildAfhArgs({ deviceIndex = null } = {}) {
  const args = [];
  if (deviceIndex != null) {
    args.push('-U', String(deviceIndex));
  }
  return args;
}

export function runAfh({
  deviceIndex = null,
  timeoutSeconds = null,
  spawnImpl,
  allowNonWindows = false
} = {}) {
  return runUbertoothExe({
    toolName: 'ubertooth-afh',
    extraArgs: buildAfhArgs({ deviceIndex }),
    timeoutSeconds,
    spawnImpl,
    allowNonWindows
  });
}
