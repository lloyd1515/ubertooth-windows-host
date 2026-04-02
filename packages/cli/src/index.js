#!/usr/bin/env node
import { discoverUbertoothDevices } from '../../core-usb/src/windowsPnpDiscovery.js';
import { probeUbertoothDevices } from '../../core-usb/src/windowsPnpProbe.js';
import { getReadOnlyProtocolInfo } from '../../core-usb/src/readOnlyProtocolInfo.js';
import { getReadOnlyRuntimeInfo } from '../../core-usb/src/readOnlyRuntimeInfo.js';
import { performOfficialFlash } from '../../core-usb/src/flashDevice.js';
import { performGuardedReset } from '../../core-usb/src/resetDevice.js';
import { runReadOnlyWinUsbExperiment } from '../../core-usb/src/winUsbReadOnlyExperiment.js';
import { classifyError, CliError, ERROR_CODES, renderCliError } from './errors.js';
import { renderDetectResult, renderFlashResult, renderInfoResult, renderProbeResult, renderProtocolInfoResult, renderRuntimeInfoResult, renderResetResult, renderStatusResult, renderTransportResult, renderVersionResult } from './render.js';
import { renderHelp } from './help.js';
import { mergeStatusEntries } from './status.js';

const VALID_COMMANDS = new Set(['help', 'detect', 'info', 'version', 'reset', 'flash', 'probe', 'transport', 'protocol', 'runtime', 'status']);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv) {
  const [command = 'help', ...rest] = argv;
  const parsed = {
    command,
    json: false,
    yes: false,
    file: null,
    tool: null
  };

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (token === '--json') {
      parsed.json = true;
    } else if (token === '--yes') {
      parsed.yes = true;
    } else if (token === '--file' || token === '-f') {
      parsed.file = rest[index + 1] ?? null;
      index += 1;
    } else if (token.startsWith('--file=')) {
      parsed.file = token.slice('--file='.length);
    } else if (token === '--tool') {
      parsed.tool = rest[index + 1] ?? null;
      index += 1;
    } else if (token.startsWith('--tool=')) {
      parsed.tool = token.slice('--tool='.length);
    }
  }

  return parsed;
}

function ensureDevices(entries, commandName) {
  if (!entries.length) {
    throw new CliError(ERROR_CODES.NO_DEVICE_FOUND, `No Ubertooth devices found while running '${commandName}'.`, {
      hint: 'Attach the device, confirm WinUSB binding, and try npm run detect first.'
    });
  }
}

async function waitForFullRecovery(targetPnpDeviceId, timeoutMs = 10000, pollIntervalMs = 1000) {
  const startedAt = Date.now();
  let pollCount = 0;

  while ((Date.now() - startedAt) < timeoutMs) {
    await sleep(pollIntervalMs);
    pollCount += 1;
    try {
      const protocolEntries = await getReadOnlyProtocolInfo();
      const runtimeEntries = await getReadOnlyRuntimeInfo();
      const protocolEntry = protocolEntries.find((entry) => entry.pnpDeviceId === targetPnpDeviceId) ?? (protocolEntries.length === 1 ? protocolEntries[0] : null);
      const runtimeEntry = runtimeEntries.find((entry) => entry.pnpDeviceId === targetPnpDeviceId) ?? (runtimeEntries.length === 1 ? runtimeEntries[0] : null);
      const runtimeHealthy = runtimeEntry?.runtimeInfo?.rawRequests?.every((entry) => entry.success && entry.lengthTransferred > 0);
      if (protocolEntry?.protocolInfo?.parsed?.firmwareRevision && runtimeHealthy) {
        return {
          successful: true,
          elapsedMs: Date.now() - startedAt,
          pollCount,
          protocolEntry,
          runtimeEntry
        };
      }
    } catch {
      // expected briefly while the interface settles after reboot/flash
    }
  }

  return {
    successful: false,
    elapsedMs: Date.now() - startedAt,
    pollCount,
    protocolEntry: null,
    runtimeEntry: null
  };
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);

  if (!VALID_COMMANDS.has(args.command)) {
    throw new CliError(ERROR_CODES.UNSUPPORTED_COMMAND, `Unsupported command: ${args.command}`, {
      hint: 'Run npm run help to see the supported safe commands.'
    });
  }

  if (args.command === 'help') {
    console.log(renderHelp());
    return;
  }

  if (args.command === 'probe') {
    const probes = await probeUbertoothDevices();
    ensureDevices(probes, 'probe');
    console.log(args.json ? JSON.stringify({ count: probes.length, devices: probes }, null, 2) : renderProbeResult(probes));
    return;
  }

  if (args.command === 'transport') {
    const entries = await runReadOnlyWinUsbExperiment();
    ensureDevices(entries, 'transport');
    console.log(args.json ? JSON.stringify({ count: entries.length, devices: entries }, null, 2) : renderTransportResult(entries));
    return;
  }

  if (args.command === 'protocol') {
    const entries = await getReadOnlyProtocolInfo();
    ensureDevices(entries, 'protocol');
    console.log(args.json ? JSON.stringify({ count: entries.length, devices: entries }, null, 2) : renderProtocolInfoResult(entries));
    return;
  }

  if (args.command === 'version') {
    const entries = await getReadOnlyProtocolInfo();
    ensureDevices(entries, 'version');
    console.log(args.json ? JSON.stringify({ count: entries.length, devices: entries }, null, 2) : renderVersionResult(entries));
    return;
  }

  if (args.command === 'reset') {
    if (!args.yes) {
      throw new CliError(ERROR_CODES.RESET_CONFIRM_REQUIRED, 'Reset is state-changing. Re-run with --yes to confirm the guarded reboot request.', {
        hint: 'Example: npm run reset -- --yes'
      });
    }

    const result = await performGuardedReset();
    if (!result.successful) {
      throw new CliError(ERROR_CODES.RESET_RECONNECT_TIMEOUT, `Reset was requested for '${result.preReset?.name ?? 'the device'}', but it did not reappear within ${result.elapsedMs} ms.`, {
        hint: 'The reboot request may still have been sent. Re-run npm run detect and npm run probe before assuming the device is gone.',
        details: result
      });
    }

    const recovery = await waitForFullRecovery(result.preReset?.pnpDeviceId);
    result.protocolRecovery = recovery;
    if (!recovery.successful) {
      throw new CliError(ERROR_CODES.RESET_RECONNECT_TIMEOUT, `The device reappeared after reset, but full status recovery did not settle within ${recovery.elapsedMs} ms.`, {
        hint: 'Wait a few seconds and re-run npm run status. The device may still be finishing WinUSB re-enumeration.',
        details: result
      });
    }

    console.log(args.json ? JSON.stringify(result, null, 2) : renderResetResult([result]));
    return;
  }

  if (args.command === 'flash') {
    if (!args.file) {
      throw new CliError(ERROR_CODES.FLASH_FILE_REQUIRED, 'Flash is state-changing and requires --file <path-to-official.dfu>.', {
        hint: 'Example: npm run flash -- --file .\\firmware\\bluetooth_rxtx.dfu --yes'
      });
    }

    if (!args.yes) {
      throw new CliError(ERROR_CODES.FLASH_CONFIRM_REQUIRED, 'Flash writes firmware. Re-run with --file <path-to-official.dfu> --yes to confirm the official flashing flow.', {
        hint: 'Example: npm run flash -- --file .\\firmware\\bluetooth_rxtx.dfu --yes'
      });
    }

    const result = await performOfficialFlash({
      firmwarePath: args.file,
      flashExecutable: args.tool ?? 'ubertooth-dfu'
    });

    if (result.recoveryRequired) {
      throw new CliError(ERROR_CODES.FLASH_RECOVERY_REQUIRED, `Firmware transfer completed for '${result.preFlash?.name ?? 'the device'}', but the final reset step still needs recovery.`, {
        hint: 'Run official ubertooth-util -r from the same release tools or unplug/replug the device, then re-run npm run version or npm run status.',
        details: result
      });
    }

    if (!result.successful) {
      throw new CliError(ERROR_CODES.FLASH_RECONNECT_TIMEOUT, `Firmware flashing was requested for '${result.preFlash?.name ?? 'the device'}', but it did not return within ${result.elapsedMs} ms.`, {
        hint: 'Follow docs/flashing.md recovery steps, then re-run npm run version or npm run status before assuming the flash failed.',
        details: result
      });
    }

    const recovery = await waitForFullRecovery(result.preFlash?.pnpDeviceId, 20000, 1000);
    result.protocolRecovery = recovery;
    if (!recovery.successful) {
      throw new CliError(ERROR_CODES.FLASH_RECONNECT_TIMEOUT, `The device reappeared after flash, but full status recovery did not settle within ${recovery.elapsedMs} ms.`, {
        hint: 'Wait a few seconds, then re-run npm run version or npm run status. If needed, follow docs/flashing.md recovery steps.',
        details: result
      });
    }

    console.log(args.json ? JSON.stringify(result, null, 2) : renderFlashResult([result]));
    return;
  }

  if (args.command === 'runtime') {
    const entries = await getReadOnlyRuntimeInfo();
    ensureDevices(entries, 'runtime');
    console.log(args.json ? JSON.stringify({ count: entries.length, devices: entries }, null, 2) : renderRuntimeInfoResult(entries));
    return;
  }

  if (args.command === 'status') {
    const protocolEntries = await getReadOnlyProtocolInfo();
    const runtimeEntries = await getReadOnlyRuntimeInfo();
    const entries = mergeStatusEntries(protocolEntries, runtimeEntries);
    ensureDevices(entries, 'status');
    console.log(args.json ? JSON.stringify({ count: entries.length, devices: entries }, null, 2) : renderStatusResult(entries));
    return;
  }

  const devices = await discoverUbertoothDevices();
  ensureDevices(devices, args.command);
  const output = args.command === 'info' || args.json
    ? renderInfoResult(devices)
    : renderDetectResult(devices);

  console.log(output);
}

main().catch((error) => {
  const classified = classifyError(error, { command: process.argv[2] });
  console.error(renderCliError(classified));
  process.exitCode = 1;
});
