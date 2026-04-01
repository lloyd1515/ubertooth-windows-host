import test from 'node:test';
import assert from 'node:assert/strict';

import {
  UBERTOOTH_USB_ID,
  describeMatch,
  extractVidPid,
  matchesUbertoothPnpId,
  normalizeHexSegment
} from '../src/ubertoothUsbIdentity.js';

test('normalizeHexSegment uppercases and trims values', () => {
  assert.equal(normalizeHexSegment(' 1d50 '), '1D50');
});

test('extractVidPid reads Windows PNP device IDs', () => {
  assert.deepEqual(
    extractVidPid('USB\\VID_1d50&PID_6002\\1234'),
    { vendorId: '1D50', productId: '6002' }
  );
});

test('matchesUbertoothPnpId recognizes the official Ubertooth VID/PID', () => {
  assert.equal(matchesUbertoothPnpId('USB\\VID_1D50&PID_6002\\ABC'), true);
  assert.equal(matchesUbertoothPnpId('USB\\VID_1D50&PID_9999\\ABC'), false);
});

test('describeMatch reports IDs and match state', () => {
  assert.deepEqual(
    describeMatch({ pnpDeviceId: 'USB\\VID_1D50&PID_6002\\XYZ' }),
    {
      vendorId: UBERTOOTH_USB_ID.vendorId,
      productId: UBERTOOTH_USB_ID.productId,
      isUbertooth: true
    }
  );
});
