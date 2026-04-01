import test from 'node:test';
import assert from 'node:assert/strict';

import { renderDetectResult, renderInfoResult, renderProbeResult, renderProtocolInfoResult, renderRuntimeInfoResult, renderStatusResult, renderTransportResult } from '../src/render.js';

test('renderDetectResult handles no devices', () => {
  assert.equal(renderDetectResult([]), 'No Ubertooth devices found on this Windows host.');
});

test('renderDetectResult formats a device summary', () => {
  const output = renderDetectResult([
    {
      name: 'Ubertooth One',
      status: 'OK',
      manufacturer: 'Great Scott Gadgets',
      service: 'WinUSB',
      pnpDeviceId: 'USB\\VID_1D50&PID_6002\\ABC'
    }
  ]);

  assert.match(output, /Detected Ubertooth device/);
  assert.match(output, /WinUSB/);
});

test('renderInfoResult returns pretty JSON', () => {
  const output = renderInfoResult([{ name: 'Ubertooth One' }]);
  assert.match(output, /"count": 1/);
  assert.match(output, /"name": "Ubertooth One"/);
});

test('renderProbeResult shows transport readiness', () => {
  const output = renderProbeResult([
    {
      name: 'Ubertooth One',
      properties: {
        driverProvider: 'Microsoft',
        driverVersion: '10.0',
        className: 'USBDevice',
        locationInfo: 'Port_#0001.Hub_#0002'
      },
      transportReadiness: {
        readyForReadOnlyWinUsbExperiment: true,
        blockers: []
      }
    }
  ]);

  assert.match(output, /Ready for read-only WinUSB experiment: yes/);
  assert.match(output, /Port_#0001.Hub_#0002/);
});

test('renderTransportResult summarizes a successful read-only open', () => {
  const output = renderTransportResult([
    {
      name: 'Ubertooth One',
      preferredInterfacePath: '\\\\?\\USB#VID_1D50&PID_6002#ABC#{a5dcbf10-6530-11d2-901f-00c04fb951ed}',
      interfaces: [{}, {}, {}],
      readOnlyWinUsb: {
        deviceSpeedLabel: 'full-or-lower',
        deviceSpeedCode: 1,
        descriptor: {
          idVendor: 0x1D50,
          idProduct: 0x6002,
          bcdDevice: 0x0107,
          maxPacketSize0: 64
        }
      }
    }
  ]);

  assert.match(output, /Read-only WinUSB open: success/);
  assert.match(output, /0x1D50:0x6002/);
});

test('renderProtocolInfoResult summarizes read-only protocol info', () => {
  const output = renderProtocolInfoResult([
    {
      name: 'Ubertooth One',
      protocolInfo: {
        parsed: {
          apiVersion: { formatted: '1.07' },
          firmwareRevision: '2020-12-R1',
          compileInfo: 'hello',
          boardId: { value: 1, name: 'Ubertooth One' },
          serial: '04300009480c2cafca48ef5ac22000f5',
          partNumber: { hex: '0x25011723' }
        }
      }
    }
  ]);

  assert.match(output, /Firmware revision: 2020-12-R1/);
  assert.match(output, /Part number: 0x25011723/);
});

test('renderRuntimeInfoResult summarizes read-only runtime info', () => {
  const output = renderRuntimeInfoResult([
    {
      name: 'Ubertooth One',
      runtimeInfo: {
        parsed: {
          leds: { usr: true, rx: false, tx: true },
          rails: { cc1v8Enabled: true },
          radio: {
            channelMhz: 2406,
            bluetoothChannelIndex: 4,
            modulation: { name: 'BT_LOW_ENERGY', value: 1 },
            paEnabled: true,
            highGainMode: true,
            paLevel: 7,
            squelch: { raw: 228, signed: -28 }
          },
          clock: { clkn: 305419896 }
        }
      }
    }
  ]);

  assert.match(output, /Channel: 2406 MHz/);
  assert.match(output, /Clock \(CLKN\): 305419896/);
});

test('renderStatusResult summarizes the current safe public baseline', () => {
  const output = renderStatusResult([
    {
      name: 'Ubertooth One',
      status: 'OK',
      service: 'WINUSB',
      transportReadiness: { readyForReadOnlyWinUsbExperiment: true },
      protocolInfo: {
        parsed: {
          firmwareRevision: '2020-12-R1',
          apiVersion: { formatted: '1.07' },
          boardId: { name: 'Ubertooth One' },
          serial: '04300009480c2cafca48ef5ac22000f5'
        }
      },
      runtimeInfo: {
        parsed: {
          radio: { channelMhz: 2441, modulation: { name: 'BT_BASIC_RATE' }, paEnabled: false, highGainMode: false, paLevel: 7 },
          leds: { usr: false, rx: false, tx: false },
          rails: { cc1v8Enabled: true }
        }
      }
    }
  ]);

  assert.match(output, /Ubertooth safe status summary/i);
  assert.match(output, /Safety boundary: read-only only/i);
});
