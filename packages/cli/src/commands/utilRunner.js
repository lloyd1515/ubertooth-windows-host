import { runUbertoothExe } from '../ubertoothExeRunner.js';

export function buildUtilArgs({
  deviceIndex = null,
  version = false,
  reset = false,
  info = false,
  led = null
} = {}) {
  const args = [];
  if (deviceIndex != null) {
    args.push('-U', String(deviceIndex));
  }
  if (version) {
    args.push('-v');
  }
  if (reset) {
    args.push('-r');
  }
  if (info) {
    args.push('-i');
  }
  if (led != null) {
    args.push('-l', String(led));
  }
  return args;
}

export function runUtil(opts = {}) {
  const { spawnImpl, allowNonWindows, ...utilOpts } = opts;
  const extraArgs = buildUtilArgs(utilOpts);
  return runUbertoothExe({
    toolName: 'ubertooth-util',
    extraArgs,
    spawnImpl,
    allowNonWindows
  });
}
