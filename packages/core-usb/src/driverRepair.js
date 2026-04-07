import { runTextCommand } from './commandRunner.js';

export function buildRepairArgs(instanceId, action) {
  switch (action) {
    case 'restart':
      return ['/restart-device', instanceId];
    case 'remove':
      return ['/remove-device', instanceId];
    case 'rescan':
      return ['/scan-devices'];
    default:
      throw new Error(`Unsupported repair action: ${action}`);
  }
}

export async function repairDevice(instanceId, {
  action = 'restart',
  execFileImpl,
  timeoutMs = 30000,
  allowNonWindows = false
} = {}) {
  const args = buildRepairArgs(instanceId, action);
  
  try {
    const stdout = await runTextCommand('pnputil', args, {
      execFileImpl,
      timeoutMs,
      allowNonWindows
    });

    return {
      success: true,
      stdout,
      action,
      instanceId
    };
  } catch (error) {
    const err = new Error(`UBT-DRV-001: pnputil ${action} failed for ${instanceId || 'host'}. ${error.message}`);
    err.stdout = error.stdout;
    err.stderr = error.stderr;
    err.code = error.code;
    throw err;
  }
}

export async function fullDriverRecovery(instanceId, {
  execFileImpl,
  timeoutMs = 60000,
  allowNonWindows = false
} = {}) {
  // Step 1: Remove device (force driver unbind/cleanup)
  await repairDevice(instanceId, { action: 'remove', execFileImpl, timeoutMs, allowNonWindows });
  
  // Step 2: Rescan for hardware changes
  await repairDevice(null, { action: 'rescan', execFileImpl, timeoutMs, allowNonWindows });
  
  return {
    success: true,
    message: 'Full driver recovery initiated: device removed and rescan triggered.'
  };
}
