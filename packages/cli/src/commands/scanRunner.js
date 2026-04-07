import { runUbertoothExe } from '../ubertoothExeRunner.js';

export async function runScan({ timeoutSeconds = 20, deviceIndex = null } = {}) {
  const extraArgs = [];
  if (deviceIndex !== null) {
    extraArgs.push('-U', deviceIndex.toString());
  }
  
  // -s: HCI scan (using our new native Windows API)
  // -t: Timeout
  extraArgs.push('-s', '-t', timeoutSeconds.toString());

  return runUbertoothExe({
    toolName: 'ubertooth-scan',
    extraArgs,
    stdio: 'inherit'
  });
}
