# Hardware Smoke Test Matrix

Breadth validation beyond the single-device sacrificial flash test.
Documents which commands have been hardware-verified and on which configuration.

## Test Configurations

| Config ID | Windows | Node | Firmware | Driver | Purpose |
|-----------|---------|------|----------|--------|---------|
| HW-A | Win 11 23H2 | Node 22 | 2020-12-R1 | WinUSB/Zadig 2.9 | Primary development |
| HW-B | Win 11 22H2 | Node 22 | 2020-12-R1 | WinUSB/Zadig 2.8 | Regression check |
| HW-C | Win 10 22H2 | Node 22 | 2020-12-R1 | WinUSB/Zadig 2.9 | Win 10 parity |

## Read-Only Commands

| Command | HW-A | HW-B | HW-C | Notes |
|---------|------|------|------|-------|
| `npm run detect` | ✅ | ✅ | ✅ | PnP enumeration |
| `npm run probe` | ✅ | ✅ | ✅ | Driver metadata |
| `npm run transport-check` | ✅ | ✅ | ✅ | WinUSB open + descriptor |
| `npm run protocol-info` | ✅ | ✅ | ✅ | Firmware/version/board/serial |
| `npm run runtime-info` | ✅ | ✅ | ✅ | LEDs/channel/modulation/PA |
| `npm run version` | ✅ | ✅ | ✅ | Concise version summary |
| `npm run status` | ✅ | ✅ | ✅ | Human-friendly summary |
| `npm run info` | ✅ | ✅ | ✅ | Raw JSON discovery |

## Guarded Control Commands

| Command | HW-A | HW-B | HW-C | Notes |
|---------|------|------|------|-------|
| `npm run reset -- --yes` | ✅ | ✅ | ⚠️ | Reboot + reconnect verified on HW-A/B; HW-C scheduled |
| `npm run flash -- --file ... --yes` | ✅ (sacrificial) | — | — | One validated run; further runs require dedicated hardware |

## Capture Commands

| Command | HW-A | HW-B | HW-C | Notes |
|---------|------|------|------|-------|
| `npm run capture` | ✅ | ✅ | ⚠️ | Requires ubertooth-btle in PATH |
| `npm run capture -- --output file.log` | ✅ | ✅ | ⚠️ | File export verified |

## DFU Mode Detection

| Scenario | HW-A | Notes |
|----------|------|-------|
| Device in DFU mode (PID 0x6003) | ✅ | Detected and reported by CLI |
| Recovery after bad flash | ✅ | Documented in `docs/flashing.md` |

## Error Path Validation

| Scenario | Status | Notes |
|----------|--------|-------|
| No device connected | ✅ | UBT-001 error code returned |
| Wrong driver (not WinUSB) | ✅ | UBT-002 error code returned |
| Device busy / access denied | ✅ | UBT-003 error code returned |
| Reset without --yes flag | ✅ | Guardrail triggers, exit 1 |
| Flash without --yes flag | ✅ | Guardrail triggers, exit 1 |

## Scheduling / Gaps

- HW-C capture commands: scheduled next hardware session
- Multi-device (2× Ubertooth One): not yet tested; no blocking known
- VM (WSL2 + usbipd): not in scope for M4; tracked in Phase 2 backlog

## Evidence Location

Raw test output and session logs are not committed to the repo.
Evidence standard: see `CONTRIBUTING.md` — "Required evidence before merge".
