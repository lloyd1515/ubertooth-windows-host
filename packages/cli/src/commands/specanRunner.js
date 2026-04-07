import { runUbertoothExe } from '../ubertoothExeRunner.js';

export function buildSpecanArgs({ deviceIndex = null } = {}) {
  const args = [];
  if (deviceIndex != null) {
    args.push('-U', String(deviceIndex));
  }
  return args;
}

export function runSpecan({
  deviceIndex = null,
  outputPath = null,
  timeoutSeconds = null,
  spawnImpl,
  allowNonWindows = false
} = {}) {
  return runUbertoothExe({
    toolName: 'ubertooth-specan',
    extraArgs: buildSpecanArgs({ deviceIndex }),
    outputPath,
    timeoutSeconds,
    spawnImpl,
    allowNonWindows
  });
}
