import test from 'node:test';
import assert from 'node:assert/strict';

import { renderHelp } from '../src/help.js';

test('renderHelp documents the status and version commands and safety boundary', () => {
  const output = renderHelp();
  assert.match(output, /status\s+Print a single human-friendly summary/i);
  assert.match(output, /version\s+Print a concise firmware\/API\/build summary/i);
  assert.match(output, /No control-out writes/i);
});
