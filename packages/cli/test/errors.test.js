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

test('classifyError maps reset guardrail failures', () => {
  const error = classifyError(new Error('Reset guardrail failed: no usable interface path was found.'));
  assert.equal(error.code, ERROR_CODES.RESET_GUARDRAIL);
});

test('classifyError maps flash file validation failures', () => {
  const error = classifyError(new Error('Flash guardrail failed: firmware image was not found at C:\\missing\\bluetooth_rxtx.dfu.'));
  assert.equal(error.code, ERROR_CODES.FLASH_FILE_REQUIRED);
});

test('classifyError maps flash execution failures', () => {
  const error = classifyError(new Error('Official flash failed: libUSB Error: Command Error: (-1)'));
  assert.equal(error.code, ERROR_CODES.FLASH_FAILED);
});

test('renderCliError includes the code and hint', () => {
  const output = renderCliError(new CliError(ERROR_CODES.NO_DEVICE_FOUND, 'missing', { hint: 'plug it in' }));
  assert.match(output, /E_DEVICE_NOT_FOUND/);
  assert.match(output, /plug it in/);
});
