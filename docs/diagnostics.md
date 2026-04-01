# Diagnostics and Error Taxonomy

## Error codes
- `E_CLI_UNSUPPORTED_COMMAND` — unsupported command name
- `E_PLATFORM_WINDOWS_ONLY` — command run on a non-Windows host
- `E_DEVICE_NOT_FOUND` — no Ubertooth detected for the selected command
- `E_PNP_QUERY_FAILED` — Windows PnP metadata lookup failed
- `E_INTERFACE_DISCOVERY_FAILED` — interface path discovery/open failed
- `E_WINUSB_INIT_FAILED` — WinUSB session initialization failed
- `E_CONTROL_TRANSFER_FAILED` — control-IN request failed after opening the device
- `E_PROTOCOL_PARSE_FAILED` — response shape did not match upstream expectations
- `E_UNKNOWN` — uncategorized failure

## Intent
These codes make the public repo easier to debug and safer to extend. They separate:
- discovery/binding failures
- WinUSB session failures
- protocol-shape mismatches
- basic CLI misuse

## Public support rule
When filing GitHub issues, include:
- command run
- error code shown
- whether `npm run detect` and `npm run probe` succeeded first
- whether the device was attached under WinUSB
