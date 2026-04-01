export function evaluateTransportReadiness(device, properties = {}) {
  const checks = {
    present: device.present === true,
    configManagerHealthy: Number(device.configManagerErrorCode ?? 0) === 0,
    winUsbBound: String(device.service ?? '').toUpperCase() === 'WINUSB',
    microsoftDriver: String(properties.driverProvider ?? '').toLowerCase() === 'microsoft',
    usbDeviceClass: String(properties.className ?? '').toUpperCase() === 'USBDEVICE'
  };

  const blockers = [];
  if (!checks.present) blockers.push('Device is not currently present.');
  if (!checks.configManagerHealthy) blockers.push(`ConfigManagerErrorCode=${device.configManagerErrorCode ?? 'unknown'}.`);
  if (!checks.winUsbBound) blockers.push('WinUSB service is not bound to the device.');
  if (!checks.microsoftDriver) blockers.push('Driver provider is not Microsoft/WinUSB-backed.');
  if (!checks.usbDeviceClass) blockers.push('Device class is not USBDevice.');

  return {
    recommendedTransport: checks.winUsbBound ? 'winusb' : 'undecided',
    readyForReadOnlyWinUsbExperiment: blockers.length === 0,
    checks,
    blockers,
    notes: blockers.length === 0
      ? ['Safe next step: attempt a read-only WinUSB open/version query path.']
      : ['Do not attempt lower-level USB transfers until the blockers above are resolved.']
  };
}
