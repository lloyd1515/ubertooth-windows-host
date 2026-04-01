export const ERROR_CODES = Object.freeze({
  UNSUPPORTED_COMMAND: 'E_CLI_UNSUPPORTED_COMMAND',
  WINDOWS_ONLY: 'E_PLATFORM_WINDOWS_ONLY',
  NO_DEVICE_FOUND: 'E_DEVICE_NOT_FOUND',
  PNP_QUERY_FAILED: 'E_PNP_QUERY_FAILED',
  INTERFACE_DISCOVERY_FAILED: 'E_INTERFACE_DISCOVERY_FAILED',
  WINUSB_INIT_FAILED: 'E_WINUSB_INIT_FAILED',
  CONTROL_TRANSFER_FAILED: 'E_CONTROL_TRANSFER_FAILED',
  PROTOCOL_PARSE_FAILED: 'E_PROTOCOL_PARSE_FAILED',
  RESET_CONFIRM_REQUIRED: 'E_RESET_CONFIRM_REQUIRED',
  RESET_GUARDRAIL: 'E_RESET_GUARDRAIL',
  RESET_RECONNECT_TIMEOUT: 'E_RESET_RECONNECT_TIMEOUT',
  UNKNOWN: 'E_UNKNOWN'
});

export class CliError extends Error {
  constructor(code, message, options = {}) {
    super(message);
    this.name = 'CliError';
    this.code = code;
    this.hint = options.hint ?? null;
    this.details = options.details ?? null;
    this.cause = options.cause;
  }
}

export function classifyError(error, context = {}) {
  if (error instanceof CliError) {
    return error;
  }

  const message = String(error?.message ?? error ?? 'Unknown error');

  if (/only supported on Windows hosts/i.test(message)) {
    return new CliError(ERROR_CODES.WINDOWS_ONLY, message, {
      hint: 'Run this command on a Windows host with the Ubertooth attached over USB.',
      cause: error
    });
  }

  if (/No Ubertooth devices found/i.test(message)) {
    return new CliError(ERROR_CODES.NO_DEVICE_FOUND, message, {
      hint: 'Check the USB cable, WinUSB binding, and whether the device appears in Device Manager.',
      cause: error
    });
  }

  if (/Reset guardrail failed/i.test(message)) {
    return new CliError(ERROR_CODES.RESET_GUARDRAIL, message, {
      hint: 'Make sure exactly one Ubertooth is attached and that npm run probe reports the device as ready before retrying reset.',
      cause: error
    });
  }

  if (/did not reappear/i.test(message)) {
    return new CliError(ERROR_CODES.RESET_RECONNECT_TIMEOUT, message, {
      hint: 'The reset request may have been sent, but the device did not re-enumerate in time. Re-run detect/probe and reconnect the device if needed.',
      cause: error
    });
  }

  if (/WinUsb_Initialize failed/i.test(message)) {
    return new CliError(ERROR_CODES.WINUSB_INIT_FAILED, message, {
      hint: 'The device was found, but Windows did not allow a WinUSB session. Re-check the driver binding and interface path.',
      cause: error
    });
  }

  if (/WinUsb_ControlTransfer failed/i.test(message) || /ControlTransfer/i.test(message)) {
    return new CliError(ERROR_CODES.CONTROL_TRANSFER_FAILED, message, {
      hint: 'The device opened successfully, but the requested USB control transfer did not complete. Re-check command semantics and interface selection.',
      cause: error
    });
  }

  if (/CreateFile failed/i.test(message) || /pnputil/i.test(message)) {
    return new CliError(ERROR_CODES.INTERFACE_DISCOVERY_FAILED, message, {
      hint: 'The Windows interface path could not be opened or discovered cleanly. Re-run probe/transport-check to confirm driver readiness.',
      cause: error
    });
  }

  if (/JSON/i.test(message) || /Unexpected serial status byte/i.test(message) || /Unexpected part-number status byte/i.test(message)) {
    return new CliError(ERROR_CODES.PROTOCOL_PARSE_FAILED, message, {
      hint: 'The device responded, but the payload did not match the expected upstream format.',
      cause: error
    });
  }

  return new CliError(ERROR_CODES.UNKNOWN, message, {
    hint: context.command ? `Command '${context.command}' failed. Re-run with one of the narrower safe commands (detect/probe/transport/protocol/runtime/reset).` : null,
    cause: error
  });
}

export function renderCliError(error) {
  const classified = classifyError(error);
  const lines = [`[${classified.code}] ${classified.message}`];
  if (classified.hint) {
    lines.push(`Hint: ${classified.hint}`);
  }
  return lines.join('\n');
}
