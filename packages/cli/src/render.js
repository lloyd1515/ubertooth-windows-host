function formatHex16(value) {
  return `0x${Number(value).toString(16).toUpperCase().padStart(4, '0')}`;
}

function renderMissingDeviceMessage() {
  return 'No Ubertooth devices found on this Windows host.';
}

export function renderDetectResult(devices) {
  if (devices.length === 0) {
    return renderMissingDeviceMessage();
  }

  const lines = ['Detected Ubertooth device(s):'];
  for (const [index, device] of devices.entries()) {
    lines.push(`${index + 1}. ${device.name}`);
    lines.push(`   Status: ${device.status}`);
    lines.push(`   Manufacturer: ${device.manufacturer ?? 'Unknown'}`);
    lines.push(`   Service: ${device.service ?? 'Unknown'}`);
    lines.push(`   PNP Device ID: ${device.pnpDeviceId ?? 'Unknown'}`);
  }

  return lines.join('\n');
}

export function renderInfoResult(devices) {
  return JSON.stringify({
    count: devices.length,
    devices
  }, null, 2);
}

export function renderVersionResult(entries) {
  if (entries.length === 0) {
    return renderMissingDeviceMessage();
  }

  const lines = ['Ubertooth version summary:'];
  for (const [index, entry] of entries.entries()) {
    const info = entry.protocolInfo?.parsed;
    lines.push(`${index + 1}. ${entry.name}`);
    lines.push(`   Firmware revision: ${info?.firmwareRevision ?? 'Unknown'}`);
    lines.push(`   API version: ${info?.apiVersion?.formatted ?? 'Unknown'}`);
    lines.push(`   Compile info: ${info?.compileInfo ?? 'Unknown'}`);
    lines.push(`   Board: ${info?.boardId?.name ?? 'Unknown'}`);
  }

  return lines.join('\n');
}

export function renderResetResult(results) {
  if (results.length === 0) {
    return renderMissingDeviceMessage();
  }

  const lines = ['Ubertooth reset result:'];
  for (const [index, result] of results.entries()) {
    lines.push(`${index + 1}. ${result.preReset?.name ?? 'Ubertooth device'}`);
    lines.push(`   Interface: ${result.preferredInterfacePath ?? 'Unknown'}`);
    lines.push(`   Control transfer: ${result.dispatch?.controlTransferSuccess ? 'completed' : 'interrupted as device rebooted'}`);
    if (!result.dispatch?.controlTransferSuccess) {
      lines.push(`   Control transfer error: ${result.dispatch?.errorCode ?? 'Unknown'}${result.dispatch?.expectedDisconnectError ? ' (expected during reboot)' : ''}`);
    }
    lines.push(`   Reappeared: ${result.successful ? 'yes' : 'no'}`);
    lines.push(`   Reconnect wait: ${result.elapsedMs} ms across ${result.pollCount} poll(s)`);
    if (result.protocolRecovery) {
      lines.push(`   Full recovery: ${result.protocolRecovery.successful ? 'ready' : 'not ready'} after ${result.protocolRecovery.elapsedMs} ms`);
    }
    if (result.postReset) {
      lines.push(`   Post-reset health: ${result.postReset.status} | Driver: ${result.postReset.service} | Ready: ${result.postReset.transportReadiness?.readyForReadOnlyWinUsbExperiment ? 'yes' : 'no'}`);
    }
    lines.push('   Safety note: reset is a reboot only; it is not DFU or flashing.');
  }

  return lines.join('\n');
}

export function renderProbeResult(probes) {
  if (probes.length === 0) {
    return renderMissingDeviceMessage();
  }

  const lines = ['Ubertooth probe result(s):'];
  for (const [index, probe] of probes.entries()) {
    lines.push(`${index + 1}. ${probe.name}`);
    lines.push(`   Driver: ${probe.properties.driverProvider ?? 'Unknown'} ${probe.properties.driverVersion ?? ''}`.trimEnd());
    lines.push(`   Class: ${probe.properties.className ?? 'Unknown'}`);
    lines.push(`   Location: ${probe.properties.locationInfo ?? 'Unknown'}`);
    lines.push(`   Ready for read-only WinUSB experiment: ${probe.transportReadiness.readyForReadOnlyWinUsbExperiment ? 'yes' : 'no'}`);

    if (probe.transportReadiness.blockers.length > 0) {
      lines.push('   Blockers:');
      for (const blocker of probe.transportReadiness.blockers) {
        lines.push(`   - ${blocker}`);
      }
    }
  }

  return lines.join('\n');
}

export function renderTransportResult(entries) {
  if (entries.length === 0) {
    return renderMissingDeviceMessage();
  }

  const lines = ['Ubertooth transport check result(s):'];
  for (const [index, entry] of entries.entries()) {
    lines.push(`${index + 1}. ${entry.name}`);
    lines.push(`   Preferred interface: ${entry.preferredInterfacePath ?? 'None'}`);
    lines.push(`   Interface count: ${entry.interfaces.length}`);
    if (entry.readOnlyWinUsb) {
      lines.push('   Read-only WinUSB open: success');
      lines.push(`   Device speed: ${entry.readOnlyWinUsb.deviceSpeedLabel} (${entry.readOnlyWinUsb.deviceSpeedCode})`);
      lines.push(`   Descriptor VID:PID = ${formatHex16(entry.readOnlyWinUsb.descriptor.idVendor)}:${formatHex16(entry.readOnlyWinUsb.descriptor.idProduct)}`);
      lines.push(`   Descriptor bcdDevice = ${formatHex16(entry.readOnlyWinUsb.descriptor.bcdDevice)}`);
      lines.push(`   MaxPacketSize0 = ${entry.readOnlyWinUsb.descriptor.maxPacketSize0}`);
    } else {
      lines.push('   Read-only WinUSB open: not attempted');
    }
  }

  return lines.join('\n');
}

export function renderProtocolInfoResult(entries) {
  if (entries.length === 0) {
    return renderMissingDeviceMessage();
  }

  const lines = ['Ubertooth protocol info result(s):'];
  for (const [index, entry] of entries.entries()) {
    const info = entry.protocolInfo?.parsed;
    lines.push(`${index + 1}. ${entry.name}`);
    lines.push(`   API version: ${info?.apiVersion?.formatted ?? 'Unknown'}`);
    lines.push(`   Firmware revision: ${info?.firmwareRevision ?? 'Unknown'}`);
    lines.push(`   Compile info: ${info?.compileInfo ?? 'Unknown'}`);
    lines.push(`   Board ID: ${info?.boardId?.value ?? 'Unknown'} (${info?.boardId?.name ?? 'Unknown'})`);
    lines.push(`   Serial: ${info?.serial ?? 'Unknown'}`);
    lines.push(`   Part number: ${info?.partNumber?.hex ?? 'Unknown'}`);
  }

  return lines.join('\n');
}

export function renderRuntimeInfoResult(entries) {
  if (entries.length === 0) {
    return renderMissingDeviceMessage();
  }

  const lines = ['Ubertooth runtime info result(s):'];
  for (const [index, entry] of entries.entries()) {
    const info = entry.runtimeInfo?.parsed;
    lines.push(`${index + 1}. ${entry.name}`);
    lines.push(`   LEDs: usr=${info?.leds?.usr ? 'on' : 'off'}, rx=${info?.leds?.rx ? 'on' : 'off'}, tx=${info?.leds?.tx ? 'on' : 'off'}`);
    lines.push(`   1.8V rail: ${info?.rails?.cc1v8Enabled ? 'enabled' : 'disabled'}`);
    lines.push(`   Channel: ${info?.radio?.channelMhz ?? 'Unknown'} MHz` + (info?.radio?.bluetoothChannelIndex != null ? ` (Bluetooth channel ${info.radio.bluetoothChannelIndex})` : ''));
    lines.push(`   Modulation: ${info?.radio?.modulation?.name ?? 'Unknown'} (${info?.radio?.modulation?.value ?? 'Unknown'})`);
    lines.push(`   PA enabled: ${info?.radio?.paEnabled ? 'yes' : 'no'}`);
    lines.push(`   High gain mode: ${info?.radio?.highGainMode ? 'yes' : 'no'}`);
    lines.push(`   PA level: ${info?.radio?.paLevel ?? 'Unknown'}`);
    lines.push(`   Squelch: raw=${info?.radio?.squelch?.raw ?? 'Unknown'}, signed=${info?.radio?.squelch?.signed ?? 'Unknown'}`);
    lines.push(`   Clock (CLKN): ${info?.clock?.clkn ?? 'Unknown'}`);
  }

  return lines.join('\n');
}

export function renderStatusResult(entries) {
  if (entries.length === 0) {
    return renderMissingDeviceMessage();
  }

  const lines = ['Ubertooth safe status summary:'];
  for (const [index, entry] of entries.entries()) {
    const protocol = entry.protocolInfo?.parsed;
    const runtime = entry.runtimeInfo?.parsed;
    lines.push(`${index + 1}. ${entry.name}`);
    lines.push(`   Health: ${entry.status ?? 'Unknown'} | Driver: ${entry.service ?? 'Unknown'} | Ready: ${entry.transportReadiness?.readyForReadOnlyWinUsbExperiment ? 'yes' : 'no'}`);
    lines.push(`   Firmware/API: ${protocol?.firmwareRevision ?? 'Unknown'} / ${protocol?.apiVersion?.formatted ?? 'Unknown'}`);
    lines.push(`   Board: ${protocol?.boardId?.name ?? 'Unknown'} | Serial: ${protocol?.serial ?? 'Unknown'}`);
    lines.push(`   Radio: ${runtime?.radio?.channelMhz ?? 'Unknown'} MHz, ${runtime?.radio?.modulation?.name ?? 'Unknown'}, PA=${runtime?.radio?.paEnabled ? 'on' : 'off'}, HGM=${runtime?.radio?.highGainMode ? 'on' : 'off'}, PA level=${runtime?.radio?.paLevel ?? 'Unknown'}`);
    lines.push(`   LEDs: usr=${runtime?.leds?.usr ? 'on' : 'off'}, rx=${runtime?.leds?.rx ? 'on' : 'off'}, tx=${runtime?.leds?.tx ? 'on' : 'off'} | 1.8V=${runtime?.rails?.cc1v8Enabled ? 'on' : 'off'}`);
    lines.push('   Safety boundary: getter/info commands are read-only; reset is explicit, guarded, and reboot-only.');
  }

  return lines.join('\n');
}

