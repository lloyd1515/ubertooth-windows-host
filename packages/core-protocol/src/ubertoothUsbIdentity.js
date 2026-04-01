export const UBERTOOTH_USB_ID = Object.freeze({
  vendorId: '1D50',
  productId: '6002',
  manufacturer: 'Great Scott Gadgets',
  productName: 'Ubertooth One'
});

const USB_ID_PATTERN = /VID_([0-9A-F]{4}).*PID_([0-9A-F]{4})/i;

export function normalizeHexSegment(value) {
  return String(value ?? '').trim().toUpperCase();
}

export function extractVidPid(pnpDeviceId) {
  const match = String(pnpDeviceId ?? '').match(USB_ID_PATTERN);
  if (!match) {
    return null;
  }

  return {
    vendorId: normalizeHexSegment(match[1]),
    productId: normalizeHexSegment(match[2])
  };
}

export function matchesUbertoothPnpId(pnpDeviceId) {
  const ids = extractVidPid(pnpDeviceId);
  return Boolean(
    ids &&
    ids.vendorId === UBERTOOTH_USB_ID.vendorId &&
    ids.productId === UBERTOOTH_USB_ID.productId
  );
}

export function describeMatch(record) {
  const ids = extractVidPid(record?.pnpDeviceId ?? record?.PNPDeviceID);
  return {
    vendorId: ids?.vendorId ?? null,
    productId: ids?.productId ?? null,
    isUbertooth: matchesUbertoothPnpId(record?.pnpDeviceId ?? record?.PNPDeviceID)
  };
}
