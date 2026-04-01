import test from 'node:test';
import assert from 'node:assert/strict';

import { parsePnPUtilInterfaces } from '../src/windowsInterfaceDiscovery.js';

const SAMPLE = `Microsoft PnP Utility

Interfaces:
    Interface Path:         \\\\?\\USB#VID_1D50&PID_6002#ABC#{11111111-1111-1111-1111-111111111111}
    Interface Description:  Unknown
    Interface Class GUID:   {11111111-1111-1111-1111-111111111111}
    Interface Status:       Enabled

    Interface Path:         \\\\?\\USB#VID_1D50&PID_6002#ABC#{a5dcbf10-6530-11d2-901f-00c04fb951ed}
    Interface Description:  Unknown
    Interface Class GUID:   {a5dcbf10-6530-11d2-901f-00c04fb951ed}
    Interface Status:       Enabled`;

test('parsePnPUtilInterfaces extracts interface blocks', () => {
  const interfaces = parsePnPUtilInterfaces(SAMPLE);
  assert.equal(interfaces.length, 2);
  assert.equal(interfaces[1].classGuid, '{a5dcbf10-6530-11d2-901f-00c04fb951ed}');
});
