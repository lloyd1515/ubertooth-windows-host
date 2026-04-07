import { runUbertoothExe } from '../ubertoothExeRunner.js';

export async function runDucky({ quack = null, channel = 38, bdAddr = null, confirmAntenna = false, deviceIndex = null } = {}) {
  const extraArgs = [];
  if (deviceIndex !== null) {
    extraArgs.push('-U', deviceIndex.toString());
  }
  if (quack) {
    extraArgs.push('-q', quack);
  }
  if (channel) {
    extraArgs.push('-A', channel.toString());
  }
  if (bdAddr) {
    extraArgs.push('-a', bdAddr);
  }
  if (confirmAntenna) {
    extraArgs.push('--i-confirm-antenna-is-attached');
  }

  return runUbertoothExe({
    toolName: 'ubertooth-ducky',
    extraArgs,
    stdio: 'inherit'
  });
}
