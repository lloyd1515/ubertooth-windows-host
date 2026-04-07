import { runUbertoothExe } from '../ubertoothExeRunner.js';

export function buildRxArgs({ channel = null, deviceIndex = null } = {}) {
  const args = [];
  if (channel != null) {
    args.push('-c', String(channel));
  }
  if (deviceIndex != null) {
    args.push('-U', String(deviceIndex));
  }
  return args;
}

export function runRx({
  channel = null,
  deviceIndex = null,
  timeoutSeconds = null,
  spawnImpl,
  allowNonWindows = false
} = {}) {
  return runUbertoothExe({
    toolName: 'ubertooth-rx',
    extraArgs: buildRxArgs({ channel, deviceIndex }),
    timeoutSeconds,
    spawnImpl,
    allowNonWindows
  });
}
