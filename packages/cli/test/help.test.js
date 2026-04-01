import test from 'node:test';
import assert from 'node:assert/strict';

import { renderHelp } from '../src/help.js';

test('renderHelp documents the reset command, status/version commands, and safety boundary', () => {
  const output = renderHelp();
  assert.match(output, /reset\s+Send a guarded reboot request/i);
  assert.match(output, /status\s+Print a single human-friendly summary/i);
  assert.match(output, /version\s+Print a concise firmware\/API\/build summary/i);
  assert.match(output, /requires --yes/i);
});
