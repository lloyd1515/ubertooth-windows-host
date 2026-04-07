import { runUbertoothExe } from '../ubertoothExeRunner.js';

export async function runFollow({ target = null, deviceIndex = null } = {}) {
  const extraArgs = [];
  if (deviceIndex !== null) {
    extraArgs.push('-U', deviceIndex.toString());
  }
  
  if (target) {
    // Check if target is a LAP or full address
    if (target.includes(':')) {
      // Full address: extract UAP and LAP
      // Example: 00:11:22:33:44:55 -> LAP=334455, UAP=22
      const parts = target.split(':');
      if (parts.length === 6) {
        extraArgs.push('-u', parts[3]);
        extraArgs.push('-l', parts[4] + parts[5]);
      } else {
        // Fallback: let the tool handle it if possible, though it expects -u and -l
        extraArgs.push('-l', target.replace(/:/g, ''));
      }
    } else {
      // Assume LAP
      extraArgs.push('-l', target);
    }
  }

  return runUbertoothExe({
    toolName: 'ubertooth-follow',
    extraArgs,
    stdio: 'inherit'
  });
}
