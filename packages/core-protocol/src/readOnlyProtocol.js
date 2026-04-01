export const READ_ONLY_COMMANDS = Object.freeze({
  GET_SERIAL: 14,
  GET_PARTNUM: 15,
  GET_REV_NUM: 33,
  GET_BOARD_ID: 35,
  GET_COMPILE_INFO: 55
});

export const READ_ONLY_COMMAND_REQUESTS = Object.freeze([
  { key: 'firmwareRevision', request: READ_ONLY_COMMANDS.GET_REV_NUM, length: 258 },
  { key: 'compileInfo', request: READ_ONLY_COMMANDS.GET_COMPILE_INFO, length: 256 },
  { key: 'boardId', request: READ_ONLY_COMMANDS.GET_BOARD_ID, length: 1 },
  { key: 'serial', request: READ_ONLY_COMMANDS.GET_SERIAL, length: 17 },
  { key: 'partNumber', request: READ_ONLY_COMMANDS.GET_PARTNUM, length: 5 }
]);

export const BOARD_NAMES = Object.freeze([
  'Ubertooth Zero',
  'Ubertooth One',
  'ToorCon 13 Badge'
]);

export function bytesToAscii(bytes) {
  return Buffer.from(bytes).toString('utf8');
}

export function formatApiVersion(bcdDevice) {
  const value = Number(bcdDevice ?? 0);
  return `${(value >> 8) & 0xFF}.${String(value & 0xFF).padStart(2, '0')}`;
}

export function parseFirmwareRevision(bytes) {
  if (bytes.length === 2) {
    return String(bytes[0] | (bytes[1] << 8));
  }

  const declaredLength = bytes[2] ?? 0;
  return bytesToAscii(bytes.slice(3, 3 + declaredLength));
}

export function parseCompileInfo(bytes) {
  const declaredLength = bytes[0] ?? 0;
  return bytesToAscii(bytes.slice(1, 1 + declaredLength));
}

export function parseBoardId(bytes) {
  const value = bytes[0] ?? 0;
  return {
    value,
    name: BOARD_NAMES[value] ?? `Unknown (${value})`
  };
}

export function parseSerial(bytes) {
  if ((bytes[0] ?? 1) !== 0) {
    throw new Error(`Unexpected serial status byte: ${bytes[0]}`);
  }

  return bytes
    .slice(1, 17)
    .map((byte) => Number(byte).toString(16).padStart(2, '0'))
    .join('');
}

export function parsePartNumber(bytes) {
  if ((bytes[0] ?? 1) !== 0) {
    throw new Error(`Unexpected part-number status byte: ${bytes[0]}`);
  }

  const value = (bytes[1] ?? 0)
    | ((bytes[2] ?? 0) << 8)
    | ((bytes[3] ?? 0) << 16)
    | ((bytes[4] ?? 0) << 24);

  return {
    value: value >>> 0,
    hex: `0x${(value >>> 0).toString(16).toUpperCase().padStart(8, '0')}`
  };
}

export function parseReadOnlyResults(rawResults, descriptor) {
  const resultMap = Object.fromEntries(rawResults.map((entry) => [entry.key, entry]));

  return {
    apiVersion: {
      bcdDevice: descriptor?.bcdDevice ?? null,
      formatted: descriptor?.bcdDevice != null ? formatApiVersion(descriptor.bcdDevice) : null
    },
    firmwareRevision: parseFirmwareRevision(resultMap.firmwareRevision?.bytes ?? []),
    compileInfo: parseCompileInfo(resultMap.compileInfo?.bytes ?? []),
    boardId: parseBoardId(resultMap.boardId?.bytes ?? []),
    serial: parseSerial(resultMap.serial?.bytes ?? []),
    partNumber: parsePartNumber(resultMap.partNumber?.bytes ?? [])
  };
}
