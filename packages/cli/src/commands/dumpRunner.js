import { runUbertoothExe } from '../ubertoothExeRunner.js';

export function buildDumpArgs({ channel = null, deviceIndex = null } = {}) {
  const args = [];
  if (channel != null) {
    args.push('-c', String(channel));
  }
  if (deviceIndex != null) {
    args.push('-U', String(deviceIndex));
  }
  return args;
}

export function runDump({
  channel = null,
  deviceIndex = null,
  outputPath = null,
  timeoutSeconds = null,
  spawnImpl,
  allowNonWindows = false
} = {}) {
  return runUbertoothExe({
    toolName: 'ubertooth-dump',
    extraArgs: buildDumpArgs({ channel, deviceIndex }),
    outputPath,
    timeoutSeconds,
    spawnImpl,
    allowNonWindows
  });
}
