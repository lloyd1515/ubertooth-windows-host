# Ubertooth Windows Host

[![CI](https://github.com/lloyd1515/ubertooth-windows-host/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/lloyd1515/ubertooth-windows-host/actions/workflows/ci.yml)
[![Release dry-run](https://github.com/lloyd1515/ubertooth-windows-host/actions/workflows/release-dry-run.yml/badge.svg?branch=main)](https://github.com/lloyd1515/ubertooth-windows-host/actions/workflows/release-dry-run.yml)
[![License: GPL-2.0](https://img.shields.io/badge/License-GPL--2.0-blue.svg)](LICENSE)

Windows-first host tooling scaffold for Ubertooth, aimed at safe public use and phased progress toward Linux feature parity.

## What this repo can do today
This repo currently supports a **comprehensive Windows host suite** for Ubertooth One (v0.2.0 "High Fidelity"):
- detect the device on Windows
- inspect driver/binding/readiness metadata
- prove read-only WinUSB transport access
- read official firmware/version/build/board/serial/part information
- read official getter-only runtime state (LEDs, channel, modulation, PA flags, squelch, clock)
- perform a **guarded reboot-only reset** with reconnect-based success handling
- expose an **experimental guarded flash wrapper** around official tool semantics
- **Transmission (TX)**: Raw symbol transmission via `ubertooth-tx` and `ubertooth-ducky` (Rubber Ducky emulation)
- **BLE Analysis**: Full `ubertooth-btle` wrappers (sniff, follow, interfere)
- **Spectrum Analysis**: Run `ubertooth-specan` natively on Windows
- **Classic BT Discovery**: Run `ubertooth-rx` / `ubertooth-dump` / `ubertooth-afh`
- **Native BLE Scanning**: Scan and follow BLE devices using the Windows native Bluetooth stack (no BlueZ required)
- **Automated Repair**: Recover driver/binding issues via `repair` command
- stage validated repo-local Windows flashing assets through a safer setup helper

## Safety boundary
The project enforces a strict **Hardware Safety Protocol** to protect the Ubertooth One hardware:
- **Antenna Guard**: All transmission commands (TX) require explicit confirmation via `--i-confirm-antenna-is-attached` or a `.antenna_attached` file to prevent RF front-end damage.
- **Duty-Cycle Limit**: Transmission is limited to 60 seconds per rolling hour to prevent thermal overload of the CC2591 radio.
- **Guarded Writes**: `reset`, `flash`, and `repair` commands require the `--yes` flag to confirm device state changes.
- **Read-Only by Default**: Discovery and information commands (status, info, probe, etc.) remain strictly read-only.

## Quickstart
```powershell
cd <project-root>\ubertooth-windows-host
npm run check
npm run status
npm run duty-cycle
npm run capture -- --channel 37 --timeout-seconds 10 --output cap.pcap
```

## Command guide
- `npm run help` — show command help
- `npm run status` — human-friendly safe summary
- `npm run capture -- --channel 37 --output cap.pcap` — live BLE capture (pcap/text)
- `npm run specan -- --output survey.txt` — spectrum analyzer sweep
- `npm run rx` — Classic Bluetooth discovery (passive)
- `npm run btle` — Full BLE analysis tool (sniff/follow/interfere)
- `npm run tx -- --lap <LAP> --i-confirm-antenna-is-attached` — raw symbol transmission
- `npm run ducky -- --quack <UUID> --i-confirm-antenna-is-attached` — Rubber Ducky emulation
- `npm run scan` — native Windows BLE device scan
- `npm run follow -- --target <ID>` — native Windows BLE connection follow
- `npm run reset -- --yes` — guarded reboot request with reconnect verification
- `npm run flash -- --file C:\path\to\firmware.dfu --yes` — guarded official firmware update
- `npm run repair -- --yes` — automated driver/binding recovery
- `npm run duty-cycle` — show transmission usage and safety limits
- `npm run version` — concise firmware/API/build summary
- `npm run detect` — minimal detection output
- `npm run probe` — driver and readiness metadata
- `npm run protocol-info` — upstream-backed firmware/build/serial info
- `npm run runtime-info` — upstream-backed getter-only runtime state
- `npm run util` — device utility (info/reset)
- `npm run debug` — read/write radio registers
- `npm run ego` — Ubertooth Ego mode
- `npm run analyze -- --file log.txt` — summarize BLE packet logs

## Diagnostics
Errors are categorized with stable codes to make GitHub issues less chaotic. See `docs/diagnostics.md`.

## Install / build
See `docs/install.md` for the reproducible Windows setup and the safer setup helper, `docs/flashing.md` for the guarded firmware workflow boundary, `docs/native-windows-flash-blocker.md` for the current native-Windows status/history, and `npm link` for local CLI usage.

## Release posture
This is a **credible Windows baseline** with a guarded flash wrapper. Native Windows proof-build viability for the official flashing tools is demonstrated, one sacrificial-device validation run succeeded on Windows, and a safer repo-local Windows setup helper now stages the validated flashing assets for users. See `docs/release-process.md`, `docs/native-windows-flash-blocker.md`, and `CHANGELOG.md`.

## Public-repo framing
The project has proven that Windows can safely:
- enumerate the device
- bind via WinUSB
- open the device read-only
- speak official getter-only protocol requests
- send a guarded reboot request and verify that the device comes back
- wrap the official `ubertooth-dfu` flow with preflight checks and recovery docs
- build and execute the official `ubertooth-dfu` / `ubertooth-util` toolchain natively on Windows in a proof-build configuration
- complete one sacrificial-device flash validation run on native Windows
- stage the validated repo-local Windows flash tooling and firmware assets through `npm run setup-flash-tools` / `scripts/setup-windows-flash-tools.ps1`

The setup helper is intentionally safer than a full installer:
- no automatic driver installation
- no silent PATH changes
- no hidden downloads/builds
- no hidden admin-wide machine mutation

## Next recommended work
1. keep reset explicit and guarded
2. keep diagnostics sharp and actionable
3. broaden validation breadth or move to Milestone 3 / capture-export MVP

See also:
- `docs/quickstart.md`
- `docs/install.md`
- `docs/flashing.md`
- `docs/native-windows-flash-blocker.md`
- `docs/diagnostics.md`
- `docs/release-process.md`
- `docs/reset-safety-review.md`
- `docs/repo-hardening.md`
- `docs/milestone-0-implementation.md`
- `docs/protocol-research.md`
- `docs/runtime-research.md`
