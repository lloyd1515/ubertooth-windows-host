import test from 'node:test';
import assert from 'node:assert/strict';

import { renderHelp } from '../src/help.js';

test('renderHelp documents the status command and safety boundary', () => {
  const output = renderHelp();
  assert.match(output, /status\s+Print a single human-friendly summary/i);
  assert.match(output, /No control-out writes/i);
});
