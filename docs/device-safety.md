# Device Safety Policy

## Non-goals
- No default firmware experimentation beyond official safe flows.
- No undocumented writes to device memory.
- No casual parity claims that encourage risky user behavior.

## Hardware Safety Protocol (HSP)
To protect the CC2591 RF front-end and the Ubertooth One hardware from permanent damage:
- **Antenna Guard**: All transmission commands (TX) require explicit confirmation via `--i-confirm-antenna-is-attached`. Transmitting without an antenna can destroy the device.
- **Duty-Cycle Enforcement**: Software-enforced limit of 60 seconds of transmission time per rolling hour. This prevents thermal overload of the radio.
- **Guarded Writes**: `reset`, `flash`, and `repair` commands require the `--yes` confirmation flag.
- **WinUSB Boundary**: Interaction is limited to official Windows APIs and safe control-transfer semantics.

## Guardrails
- Read-only commands remain the default for discovery and info.
- Flashing requires preflight checks, recovery docs, and official tool wrappers.
- Every risky path (TX or State-Change) needs an explicit confirmation boundary.
- Device/firmware compatibility matrix must be updated before release.
