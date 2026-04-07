# Behavioral Contracts: Ubertooth Windows Host

This document defines the **executable success criteria** for the 27 CLI commands, following the **LobeHub SDD Phase 4** (Behavioral Contracts) model [1].

## 1. Discovery & Diagnostics
| Command | Behavior | Success Criterion |
|---------|----------|-------------------|
| `detect` | Scan for PnP/WMI devices. | Must return 1+ `Ubertooth One` entries with a valid PNP Device ID. |
| `info` | Read raw discovery state. | Must return valid JSON containing `BusNumber`, `Address`, and `PnpId`. |
| `version` | Query firmware protocol. | Must return a string containing `Firmware revision: <version>`. |
| `probe` | Check WinUSB readiness. | Must report `Ready for read-only WinUSB experiment: yes`. |

## 2. Hardware Control (Guarded)
| Command | Behavior | Success Criterion |
|---------|----------|-------------------|
| `reset` | Send EP0 control-OUT. | Device must disconnect and reappear within 10 seconds. |
| `flash` | Execute `ubertooth-dfu`. | Must pass `--file` validation and verify reconnect after write. |
| `repair` | Invoke `pnputil`. | Must successfully restart the device stack with exit code 0. |

## 3. Transmission (HSP-Gated)
| Command | Behavior | Success Criterion |
|---------|----------|-------------------|
| `tx` | Stream symbols to EP5. | Must BLOCK unless `--i-confirm-antenna-is-attached` is passed. |
| `ducky` | Emulate Rubber Ducky. | Must verify duty-cycle limit (<60s/hour) before execution. |

## 4. Analysis & Capture
| Command | Behavior | Success Criterion |
|---------|----------|-------------------|
| `capture` | Stream packets from EP2. | Must pipe raw data to `stdout` or write to `.pcap` if requested. |
| `btle` | Full analysis suite. | Must successfully validate CRC in promiscuous mode by default. |

## Sources
- [1] LobeHub: Spec-Driven Development (2026) - Behavioral Contracts Phase.
