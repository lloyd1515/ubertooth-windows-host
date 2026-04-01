#!/usr/bin/env node
import { discoverUbertoothDevices } from '../../core-usb/src/windowsPnpDiscovery.js';
import { probeUbertoothDevices } from '../../core-usb/src/windowsPnpProbe.js';
import { getReadOnlyProtocolInfo } from '../../core-usb/src/readOnlyProtocolInfo.js';
import { getReadOnlyRuntimeInfo } from '../../core-usb/src/readOnlyRuntimeInfo.js';
import { runReadOnlyWinUsbExperiment } from '../../core-usb/src/winUsbReadOnlyExperiment.js';
import { classifyError, CliError, ERROR_CODES, renderCliError } from './errors.js';
import { renderDetectResult, renderInfoResult, renderProbeResult, renderProtocolInfoResult, renderRuntimeInfoResult, renderStatusResult, renderTransportResult, renderVersionResult } from './render.js';
import { renderHelp } from './help.js';
import { mergeStatusEntries } from './status.js';

const VALID_COMMANDS = new Set(['help', 'detect', 'info', 'version', 'probe', 'transport', 'protocol', 'runtime', 'status']);

function parseArgs(argv) {
  const [command = 'help', ...rest] = argv;
  return {
    command,
    json: rest.includes('--json')
  };
}

function ensureDevices(entries, commandName) {
  if (!entries.length) {
    throw new CliError(ERROR_CODES.NO_DEVICE_FOUND, `No Ubertooth devices found while running '${commandName}'.`, {
      hint: 'Attach the device, confirm WinUSB binding, and try npm run detect first.'
    });
  }
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
