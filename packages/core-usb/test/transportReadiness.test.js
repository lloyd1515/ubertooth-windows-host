import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateTransportReadiness } from '../src/transportReadiness.js';

test('evaluateTransportReadiness marks a healthy WinUSB-bound device as ready', () => {
  const result = evaluateTransportReadiness(
    { present: true, configManagerErrorCode: 0, service: 'WINUSB' },
    { driverProvider: 'Microsoft', className: 'USBDevice' }
  );

  assert.equal(result.readyForReadOnlyWinUsbExperiment, true);
  assert.equal(result.recommendedTransport, 'winusb');
  assert.deepEqual(result.blockers, []);
});

test('evaluateTransportReadiness reports blockers for an unhealthy device', () => {
  const result = evaluateTransportReadiness(
    { present: false, configManagerErrorCode: 10, service: 'usbccgp' },
    { driverProvider: 'Unknown', className: 'Other' }
  );

  assert.equal(result.readyForReadOnlyWinUsbExperiment, false);
  assert.match(result.blockers.join(' '), /not currently present/i);
  assert.match(result.blockers.join(' '), /WinUSB service is not bound/i);
});
