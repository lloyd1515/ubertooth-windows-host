#!/usr/bin/env node
import { createReadStream } from 'node:fs';
import { discoverUbertoothDevices } from '../../core-usb/src/windowsPnpDiscovery.js';
import { probeUbertoothDevices } from '../../core-usb/src/windowsPnpProbe.js';
import { getReadOnlyProtocolInfo } from '../../core-usb/src/readOnlyProtocolInfo.js';
import { getReadOnlyRuntimeInfo } from '../../core-usb/src/readOnlyRuntimeInfo.js';
import { performOfficialFlash } from '../../core-usb/src/flashDevice.js';
import { performGuardedReset } from '../../core-usb/src/resetDevice.js';
import { repairDevice, fullDriverRecovery } from '../../core-usb/src/driverRepair.js';
import { runReadOnlyWinUsbExperiment } from '../../core-usb/src/winUsbReadOnlyExperiment.js';
import { runLiveBleInspector } from '../../capture-export/src/liveBleInspector.js';
import { summarizePackets } from './analyze.js';
import { runSpecan } from './commands/specanRunner.js';
import { runRx } from './commands/rxRunner.js';
import { runDump } from './commands/dumpRunner.js';
import { runAfh } from './commands/afhRunner.js';
import { runUtil } from './commands/utilRunner.js';
import { runScan } from './commands/scanRunner.js';
import { runFollow } from './commands/followRunner.js';
import { runDucky } from './commands/duckyRunner.js';
import { runTx } from './commands/txRunner.js';
import { runDebug } from './commands/debugRunner.js';
import { runEgo } from './commands/egoRunner.js';
import { runBtle } from './commands/btleRunner.js';
import { getDutyCycleDataSync, DUTY_CYCLE_LIMIT_SECONDS } from './ubertoothExeRunner.js';
import { classifyError, CliError, ERROR_CODES, renderCliError } from './errors.js';
import { renderDetectResult, renderFlashResult, renderInfoResult, renderProbeResult, renderProtocolInfoResult, renderRuntimeInfoResult, renderResetResult, renderStatusResult, renderTransportResult, renderVersionResult, renderDutyCycleResult } from './render.js';
import { renderHelp } from './help.js';
import { mergeStatusEntries } from './status.js';

const VALID_COMMANDS = new Set(['help', 'detect', 'info', 'version', 'reset', 'flash', 'capture', 'probe', 'transport', 'protocol', 'runtime', 'status', 'specan', 'rx', 'dump', 'afh', 'util', 'scan', 'follow', 'repair', 'analyze', 'ducky', 'tx', 'debug', 'ego', 'btle', 'duty-cycle']);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv) {
  const [command = 'help', ...rest] = argv;
  const parsed = {
    command,
    json: false,
    yes: false,
    channel: null,
    file: null,
    output: null,
    timeoutSeconds: null,
    tool: null,
    deviceIndex: null,
    rssi: false,
    follow: false,
    target: null,
    full: false,
    quack: null,
    lap: null,
    uap: null,
    bdAddr: null,
    register: null,
    verbose: false,
    confirmAntenna: false,
    promiscuous: false,
    interfere: false,
    interfereContinuous: false,
    address: null,
    slave: null,
    pcapng: null,
    pcap: null,
    pcapPpi: null,
    verifyCrc: null,
    aaOffenses: null
  };

  const isBtle = command === 'btle' || command === 'follow' || command === 'capture';
  const isDucky = command === 'ducky';
  const isDebug = command === 'debug';
  const isFlashOrAnalyze = command === 'flash' || command === 'analyze';

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (token === '--json') {
      parsed.json = true;
    } else if (token === '--yes') {
      parsed.yes = true;
    } else if (token === '--full') {
      parsed.full = true;
    } else if (token === '--rssi') {
      parsed.rssi = true;
    } else if (token === '--follow' || (token === '-f' && isBtle)) {
      parsed.follow = true;
    } else if (token === '--no-follow' || token === '-n') {
      parsed.noFollow = true;
    } else if (token === '--promisc' || token === '-p') {
      parsed.promiscuous = true;
    } else if (token === '--interfere' || token === '-i') {
      parsed.interfere = true;
    } else if (token === '--interfere-continuous' || token === '-I') {
      parsed.interfereContinuous = true;
    } else if (token === '--address' || (token === '-a' && isBtle)) {
      parsed.address = rest[index + 1] ?? null;
      index += 1;
    } else if (token === '--slave' || token === '-s') {
      parsed.slave = rest[index + 1] ?? null;
      index += 1;
    } else if (token === '--pcapng' || (token === '-r' && isBtle)) {
      parsed.pcapng = rest[index + 1] ?? null;
      index += 1;
    } else if (token === '--pcap' || (token === '-q' && isBtle)) {
      parsed.pcap = rest[index + 1] ?? null;
      index += 1;
    } else if (token === '--pcap-ppi' || token === '-c') {
      parsed.pcapPpi = rest[index + 1] ?? null;
      index += 1;
    } else if (token === '--verify-crc' || (token === '-v' && isBtle)) {
      parsed.verifyCrc = rest[index + 1] ?? null;
      index += 1;
    } else if (token === '--aa-offenses' || token === '-x') {
      parsed.aaOffenses = rest[index + 1] ?? null;
      index += 1;
    } else if (token === '--verbose' || (token === '-v' && isDebug)) {
      parsed.verbose = true;
    } else if (token === '--i-confirm-antenna-is-attached') {
      parsed.confirmAntenna = true;
    } else if (token === '--target' || (token === '-t' && isBtle)) {
      parsed.target = rest[index + 1] ?? null;
      index += 1;
    } else if (token === '--quack' || (token === '-q' && isDucky)) {
      parsed.quack = rest[index + 1] ?? null;
      index += 1;
    } else if (token === '--lap' || token === '-l') {
      parsed.lap = rest[index + 1] ?? null;
      index += 1;
    } else if (token === '--uap' || token === '-u') {
      parsed.uap = rest[index + 1] ?? null;
      index += 1;
    } else if (token === '--bdaddr' || (token === '-a' && isDucky)) {
      parsed.bdAddr = rest[index + 1] ?? null;
      index += 1;
    } else if (token === '--register' || (token === '-r' && isDebug)) {
      parsed.register = rest[index + 1] ?? null;
      index += 1;
    } else if (token === '--interval' || token === '-i') {
      parsed.interval = rest[index + 1] ?? null;
      index += 1;
    } else if (token.startsWith('--interval=')) {
      parsed.interval = token.slice('--interval='.length);
    } else if (token === '--channel' || token === '-A' || (token === '-c' && !isBtle)) {
      parsed.channel = rest[index + 1] ?? null;
      index += 1;
    } else if (token.startsWith('--channel=')) {
      parsed.channel = token.slice('--channel='.length);
    } else if (token === '--device' || token === '-U') {
      parsed.deviceIndex = rest[index + 1] ?? null;
      index += 1;
    } else if (token === '--file' || (token === '-f' && isFlashOrAnalyze) || token === '-w') {
      parsed.file = rest[index + 1] ?? null;
      index += 1;
    } else if (token.startsWith('--file=')) {
      parsed.file = token.slice('--file='.length);
    } else if (token === '--output' || token === '-o') {
      parsed.output = rest[index + 1] ?? null;
      index += 1;
    } else if (token.startsWith('--output=')) {
      parsed.output = token.slice('--output='.length);
    } else if (token === '--tool') {
      parsed.tool = rest[index + 1] ?? null;
      index += 1;
    } else if (token.startsWith('--tool=')) {
      parsed.tool = token.slice('--tool='.length);
    } else if (token === '--timeout-seconds') {
      parsed.timeoutSeconds = rest[index + 1] ?? null;
      index += 1;
    } else if (token.startsWith('--timeout-seconds=')) {
      parsed.timeoutSeconds = token.slice('--timeout-seconds='.length);
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

  if (args.command === 'capture') {
    const result = await runLiveBleInspector({
      toolPath: args.tool ?? null,
      channel: args.channel,
      timeoutSeconds: args.timeoutSeconds,
      outputPath: args.output ?? null,
      rssi: args.rssi,
      follow: args.follow,
      target: args.target,
      interval: args.interval
    });

    if (result.timedOut) {
      console.log(`Capture stopped after ${result.timeoutSeconds} second(s).`);
    }
    if (result.outputPath) {
      console.log(`Capture saved to ${result.outputPath} (${result.bytesWritten} bytes).`);
    }
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

  if (args.command === 'specan') {
    const result = await runSpecan({ deviceIndex: args.deviceIndex, outputPath: args.output });
    if (result.outputPath) {
      console.log(`Spectrum analysis saved to ${result.outputPath}`);
    }
    return;
  }

  if (args.command === 'rx') {
    await runRx({ channel: args.channel, deviceIndex: args.deviceIndex });
    return;
  }

  if (args.command === 'dump') {
    const result = await runDump({ channel: args.channel, deviceIndex: args.deviceIndex, outputPath: args.output });
    if (result.outputPath) {
      console.log(`Raw dump saved to ${result.outputPath}`);
    }
    return;
  }

  if (args.command === 'afh') {
    await runAfh({ deviceIndex: args.deviceIndex });
    return;
  }

  if (args.command === 'util') {
    await runUtil({ deviceIndex: args.deviceIndex, info: true });
    return;
  }

  if (args.command === 'scan') {
    await runScan({ timeoutSeconds: args.timeoutSeconds ?? 20, deviceIndex: args.deviceIndex });
    return;
  }

  if (args.command === 'follow') {
    await runFollow({ target: args.target, deviceIndex: args.deviceIndex });
    return;
  }

  if (args.command === 'ducky') {
    await runDucky({
      quack: args.quack,
      channel: args.channel ?? 38,
      bdAddr: args.bdAddr,
      confirmAntenna: args.confirmAntenna,
      deviceIndex: args.deviceIndex
    });
    return;
  }

  if (args.command === 'tx') {
    await runTx({
      lap: args.lap,
      uap: args.uap,
      timeoutSeconds: args.timeoutSeconds ?? 0,
      confirmAntenna: args.confirmAntenna,
      deviceIndex: args.deviceIndex
    });
    return;
  }

  if (args.command === 'debug') {
    await runDebug({
      deviceIndex: args.deviceIndex,
      register: args.register,
      verbose: args.verbose
    });
    return;
  }

  if (args.command === 'ego') {
    await runEgo({ deviceIndex: args.deviceIndex });
    return;
  }

  if (args.command === 'duty-cycle') {
    const data = getDutyCycleDataSync();
    console.log(args.json ? JSON.stringify(data, null, 2) : renderDutyCycleResult(data, DUTY_CYCLE_LIMIT_SECONDS));
    return;
  }

  if (args.command === 'btle') {
    await runBtle({
      follow: args.follow,
      noFollow: args.noFollow,
      promiscuous: args.promiscuous,
      address: args.address,
      slave: args.slave,
      target: args.target,
      interfere: args.interfere,
      interfereContinuous: args.interfereContinuous,
      deviceIndex: args.deviceIndex,
      pcapng: args.pcapng,
      pcap: args.pcap,
      pcapPpi: args.pcapPpi,
      channel: args.channel,
      verifyCrc: args.verifyCrc,
      aaOffenses: args.aaOffenses,
      confirmAntenna: args.confirmAntenna,
      timeoutSeconds: args.timeoutSeconds,
      outputPath: args.output
    });
    return;
  }

  if (args.command === 'repair') {
    if (!args.yes) {
      throw new CliError(ERROR_CODES.REPAIR_CONFIRM_REQUIRED, 'Repair is state-changing and requires admin privileges. Re-run with --yes to confirm.', {
        hint: 'Example: npm run repair -- --yes'
      });
    }

    const devices = await discoverUbertoothDevices();
    ensureDevices(devices, 'repair');
    const target = devices[0];

    console.log(`Initiating repair for: ${target.name} [${target.pnpDeviceId}]...`);
    const result = args.full 
      ? await fullDriverRecovery(target.pnpDeviceId)
      : await repairDevice(target.pnpDeviceId, { action: 'restart' });

    console.log('Repair command dispatched.');
    if (args.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`Result: ${result.success ? 'Success' : 'Failed'}`);
      if (result.message) console.log(result.message);
    }
    return;
  }

  if (args.command === 'analyze') {
    if (!args.file) {
      throw new Error('analyze command requires --file <path-to-log.txt>');
    }
    const stream = createReadStream(args.file);
    console.log(`Analyzing BLE packets from ${args.file}...`);
    const summary = await summarizePackets(stream);
    
    if (args.json) {
      const channelObj = {};
      summary.channels.forEach((count, ch) => {
        if (count > 0) channelObj[ch] = count;
      });
      console.log(JSON.stringify({ ...summary, uniqueLaps: Array.from(summary.uniqueLaps), channels: channelObj }, null, 2));
    } else {
      console.log(`Analysis Complete:`);
      console.log(`- Total Packets: ${summary.packetCount}`);
      console.log(`- Unique Devices (LAPs): ${summary.uniqueLaps.size}`);
      console.log(`- Average Signal (s): ${summary.avgSnr.toFixed(2)}`);
      const activeChannels = [];
      summary.channels.forEach((count, ch) => {
        if (count > 0) activeChannels.push(`Ch${ch}:${count}`);
      });
      console.log(`- Channel Distribution: ${activeChannels.join(', ')}`);
    }
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
