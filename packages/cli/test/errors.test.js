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
  const error = classifyError(new Error('Flash guardrail failed: firmware image was not found at C:\missing\bluetooth_rxtx.dfu.'));
  assert.equal(error.code, ERROR_CODES.FLASH_FILE_REQUIRED);
});

test('classifyError maps flash execution failures', () => {
  const error = classifyError(new Error('Official flash failed: libUSB Error: Command Error: (-1)'));
  assert.equal(error.code, ERROR_CODES.FLASH_FAILED);
});

test('classifyError maps capture tool lookup failures', () => {
  const error = classifyError(new Error("Capture guardrail failed: official ubertooth-btle executable 'missing.exe' was not found."));
  assert.equal(error.code, ERROR_CODES.CAPTURE_TOOL_NOT_FOUND);
});

test('classifyError maps capture execution failures', () => {
  const error = classifyError(new Error('Live BLE capture failed: ubertooth-btle exited with code 1.'));
  assert.equal(error.code, ERROR_CODES.CAPTURE_FAILED);
});

test('classifyError maps UBT-CAP-BUSY to CAPTURE_BUSY', () => {
  const error = classifyError(new Error('UBT-CAP-BUSY: a capture is already active.'));
  assert.equal(error.code, ERROR_CODES.CAPTURE_BUSY);
  assert.match(error.hint, /already running/i);
});

test('classifyError maps UBT-CAP-002 and parses last stderr', () => {
  const error = classifyError(new Error('UBT-CAP-002: process crashed 4 times. Last exit code: 1. Last stderr: libusb error: -1'));
  assert.equal(error.code, ERROR_CODES.CAPTURE_CRASHED);
  assert.match(error.hint, /libusb error: -1/i);
});

test('classifyError maps UBT-CAP-001 and parses stderr', () => {
  const error = classifyError(new Error('UBT-CAP-001: ubertooth-btle exited unexpectedly (code 1). Stderr: could not open device'));
  assert.equal(error.code, ERROR_CODES.CAPTURE_FAILED);
  assert.match(error.hint, /could not open device/i);
});

test('classifyError maps Bluetooth state errors to BLUETOOTH_OFF', () => {
  const error = classifyError(new Error('Bluetooth state changed to poweredOff'));
  assert.equal(error.code, ERROR_CODES.BLUETOOTH_OFF);
  assert.match(error.hint, /radio is powered on/i);
});

test('classifyError maps scan command failures', () => {
  const error = classifyError(new Error('scan command failed: internal noble error'));
  assert.equal(error.code, ERROR_CODES.SCAN_FAILED);
  assert.match(error.hint, /native Windows BLE scan failed/i);
});

test('classifyError maps follow command failures', () => {
  const error = classifyError(new Error('follow command failed: device lost'));
  assert.equal(error.code, ERROR_CODES.FOLLOW_FAILED);
  assert.match(error.hint, /native Windows BLE connection follow failed/i);
});

test('renderCliError includes the code and hint', () => {
  const output = renderCliError(new CliError(ERROR_CODES.NO_DEVICE_FOUND, 'missing', { hint: 'plug it in' }));
  assert.match(output, /E_DEVICE_NOT_FOUND/);
  assert.match(output, /plug it in/);
});
