import { runUbertoothExe } from '../ubertoothExeRunner.js';

export async function runEgo({ deviceIndex = null } = {}) {
  const extraArgs = [];
  if (deviceIndex !== null) {
    extraArgs.push('-U', deviceIndex.toString());
  }

  return runUbertoothExe({
    toolName: 'ubertooth-ego',
    extraArgs,
    stdio: 'inherit'
  });
}
