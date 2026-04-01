export const READ_ONLY_RUNTIME_COMMANDS = Object.freeze({
  GET_USRLED: 3,
  GET_RXLED: 5,
  GET_TXLED: 7,
  GET_1V8: 9,
  GET_CHANNEL: 11,
  GET_PAEN: 16,
  GET_HGM: 18,
  GET_MOD: 22,
  GET_PALEVEL: 28,
  GET_SQUELCH: 37,
  GET_CLOCK: 41
});

export const READ_ONLY_RUNTIME_REQUESTS = Object.freeze([
  { key: 'usrLed', request: READ_ONLY_RUNTIME_COMMANDS.GET_USRLED, length: 1 },
  { key: 'rxLed', request: READ_ONLY_RUNTIME_COMMANDS.GET_RXLED, length: 1 },
  { key: 'txLed', request: READ_ONLY_RUNTIME_COMMANDS.GET_TXLED, length: 1 },
  { key: 'cc1v8', request: READ_ONLY_RUNTIME_COMMANDS.GET_1V8, length: 1 },
  { key: 'channel', request: READ_ONLY_RUNTIME_COMMANDS.GET_CHANNEL, length: 2 },
  { key: 'paEnabled', request: READ_ONLY_RUNTIME_COMMANDS.GET_PAEN, length: 1 },
  { key: 'highGainMode', request: READ_ONLY_RUNTIME_COMMANDS.GET_HGM, length: 1 },
  { key: 'modulation', request: READ_ONLY_RUNTIME_COMMANDS.GET_MOD, length: 1 },
  { key: 'paLevel', request: READ_ONLY_RUNTIME_COMMANDS.GET_PALEVEL, length: 1 },
  { key: 'squelch', request: READ_ONLY_RUNTIME_COMMANDS.GET_SQUELCH, length: 1 },
  { key: 'clock', request: READ_ONLY_RUNTIME_COMMANDS.GET_CLOCK, length: 4 }
]);

export const MODULATION_NAMES = Object.freeze({
  0: 'BT_BASIC_RATE',
  1: 'BT_LOW_ENERGY',
  2: 'IEEE_80211_FHSS',
  3: 'NONE'
});

function toSigned8(value) {
  const byte = Number(value ?? 0) & 0xFF;
  return byte > 127 ? byte - 256 : byte;
}

function littleEndian16(bytes) {
  return (bytes[0] ?? 0) | ((bytes[1] ?? 0) << 8);
}

function littleEndian32(bytes) {
  return ((bytes[0] ?? 0)
    | ((bytes[1] ?? 0) << 8)
    | ((bytes[2] ?? 0) << 16)
    | ((bytes[3] ?? 0) << 24)) >>> 0;
}

function parseBoolByte(bytes) {
  return Boolean(bytes[0] ?? 0);
}

export function parseRuntimeResults(rawResults) {
  const map = Object.fromEntries(rawResults.map((entry) => [entry.key, entry]));

  const channelMhz = littleEndian16(map.channel?.bytes ?? []);
  const modulationValue = Number(map.modulation?.bytes?.[0] ?? 0);
  const squelchRaw = Number(map.squelch?.bytes?.[0] ?? 0);

  return {
    leds: {
      usr: parseBoolByte(map.usrLed?.bytes ?? []),
      rx: parseBoolByte(map.rxLed?.bytes ?? []),
      tx: parseBoolByte(map.txLed?.bytes ?? [])
    },
    rails: {
      cc1v8Enabled: parseBoolByte(map.cc1v8?.bytes ?? [])
    },
    radio: {
      channelMhz,
      bluetoothChannelIndex: channelMhz >= 2402 ? channelMhz - 2402 : null,
      modulation: {
        value: modulationValue,
        name: MODULATION_NAMES[modulationValue] ?? `UNKNOWN (${modulationValue})`
      },
      paEnabled: parseBoolByte(map.paEnabled?.bytes ?? []),
      highGainMode: parseBoolByte(map.highGainMode?.bytes ?? []),
      paLevel: Number(map.paLevel?.bytes?.[0] ?? 0),
      squelch: {
        raw: squelchRaw,
        signed: toSigned8(squelchRaw)
      }
    },
    clock: {
      clkn: littleEndian32(map.clock?.bytes ?? [])
    }
  };
}
