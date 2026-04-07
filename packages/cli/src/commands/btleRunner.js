import { runUbertoothExe } from '../ubertoothExeRunner.js';

export async function runBtle({
  follow = false,
  noFollow = false,
  promiscuous = false,
  address = null,
  slave = null,
  target = null,
  interfere = false,
  interfereContinuous = false,
  deviceIndex = null,
  pcapng = null,
  pcap = null,
  pcapPpi = null,
  channel = null,
  verifyCrc = null,
  aaOffenses = null,
  confirmAntenna = false,
  timeoutSeconds = null,
  outputPath = null
} = {}) {
  const extraArgs = [];
  if (follow) extraArgs.push('-f');
  if (noFollow) extraArgs.push('-n');
  if (promiscuous) extraArgs.push('-p');
  if (address) extraArgs.push(`-a${address}`);
  if (slave) extraArgs.push(`-s${slave}`);
  if (target) extraArgs.push(`-t${target}`);
  if (interfere) extraArgs.push('-i');
  if (interfereContinuous) extraArgs.push('-I');
  if (deviceIndex !== null) extraArgs.push(`-U${deviceIndex}`);
  if (pcapng) extraArgs.push('-r', pcapng);
  if (pcap) extraArgs.push('-q', pcap);
  if (pcapPpi) extraArgs.push('-c', pcapPpi);
  if (channel !== null) extraArgs.push('-A', channel.toString());
  if (verifyCrc !== null) extraArgs.push(`-v${verifyCrc}`);
  if (aaOffenses !== null) extraArgs.push('-x', aaOffenses.toString());
  if (confirmAntenna) extraArgs.push('--i-confirm-antenna-is-attached');

  return runUbertoothExe({
    toolName: 'ubertooth-btle',
    extraArgs,
    timeoutSeconds,
    outputPath,
    stdio: 'inherit'
  });
}
