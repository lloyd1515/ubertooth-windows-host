import test from 'node:test';
import assert from 'node:assert/strict';

import { classifyError, CliError, ERROR_CODES, renderCliError } from '../src/errors.js';

test('classifyError preserves CliError instances', () => {
  const error = new CliError(ERROR_CODES.NO_DEVICE_FOUND, 'missing');
  assert.equal(classifyError(error), error);
});

test('classifyError maps Windows-only failures', () => {
  const error = classifyError(new Error('PowerShell-backed hardware discovery is only supported on Windows hosts.'));
  assert.equal(error.code, ERROR_CODES.WINDOWS_ONLY);
});

test('renderCliError includes the code and hint', () => {
  const output = renderCliError(new CliError(ERROR_CODES.NO_DEVICE_FOUND, 'missing', { hint: 'plug it in' }));
  assert.match(output, /E_DEVICE_NOT_FOUND/);
  assert.match(output, /plug it in/);
});
