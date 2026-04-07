import { runUbertoothExe } from '../ubertoothExeRunner.js';

export async function runTx({ lap = null, uap = null, timeoutSeconds = 0, confirmAntenna = false, deviceIndex = null } = {}) {
  const extraArgs = [];
  if (deviceIndex !== null) {
    extraArgs.push('-U', deviceIndex.toString());
  }
  if (lap) {
    extraArgs.push('-l', lap);
  }
  if (uap) {
    extraArgs.push('-u', uap);
  }
  if (timeoutSeconds) {
    extraArgs.push('-t', timeoutSeconds.toString());
  }
  if (confirmAntenna) {
    extraArgs.push('--i-confirm-antenna-is-attached');
  }

  return runUbertoothExe({
    toolName: 'ubertooth-tx',
    extraArgs,
    stdio: 'inherit'
  });
}
