import { runTextCommand } from './commandRunner.js';

const INTERFACE_PATH_PREFIX = 'Interface Path:';
const INTERFACE_DESCRIPTION_PREFIX = 'Interface Description:';
const INTERFACE_CLASS_GUID_PREFIX = 'Interface Class GUID:';
const INTERFACE_STATUS_PREFIX = 'Interface Status:';

export function parsePnPUtilInterfaces(output) {
  const lines = String(output ?? '').split(/\r?\n/);
  const interfaces = [];
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (current?.path) {
        interfaces.push(current);
      }
      current = null;
      continue;
    }

    if (trimmed.startsWith(INTERFACE_PATH_PREFIX)) {
      if (current?.path) {
        interfaces.push(current);
      }
      current = { path: trimmed.slice(INTERFACE_PATH_PREFIX.length).trim() };
      continue;
    }

    if (!current) {
      continue;
    }

    if (trimmed.startsWith(INTERFACE_DESCRIPTION_PREFIX)) {
      current.description = trimmed.slice(INTERFACE_DESCRIPTION_PREFIX.length).trim() || null;
    } else if (trimmed.startsWith(INTERFACE_CLASS_GUID_PREFIX)) {
      current.classGuid = trimmed.slice(INTERFACE_CLASS_GUID_PREFIX.length).trim() || null;
    } else if (trimmed.startsWith(INTERFACE_STATUS_PREFIX)) {
      current.status = trimmed.slice(INTERFACE_STATUS_PREFIX.length).trim() || null;
    }
  }

  if (current?.path) {
    interfaces.push(current);
  }

  return interfaces;
}

export async function discoverDeviceInterfaces(instanceId, {
  execFileImpl,
  timeoutMs = 10000,
  allowNonWindows = false
} = {}) {
  const stdout = await runTextCommand('pnputil', [
    '/enum-devices',
    '/instanceid',
    instanceId,
    '/interfaces',
    '/location'
  ], {
    execFileImpl,
    timeoutMs,
    allowNonWindows
  });

  return parsePnPUtilInterfaces(stdout);
}
