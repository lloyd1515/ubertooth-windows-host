# Ubertooth Windows Host

Windows-first host tooling scaffold for Ubertooth, aimed at safe public use and phased progress toward Linux feature parity.

## What this repo can do today
This repo currently supports a **safe Windows baseline** for Ubertooth One:
- detect the device on Windows
- inspect driver/binding/readiness metadata
- prove read-only WinUSB transport access
- read official firmware/version/build/board/serial/part information
- read official getter-only runtime state (LEDs, channel, modulation, PA flags, squelch, clock)
- perform a **guarded reboot-only reset** with reconnect-based success handling
- expose an **experimental guarded flash wrapper** around official tool semantics, with native Windows validation now demonstrated on one sacrificial device

## Safety boundary
Current commands are intentionally limited to:
- **control-IN** reads for getter/info commands
- one explicit guarded `reset` command
- one explicit guarded `flash` command that only wraps `ubertooth-dfu`
- no undocumented DFU/write path
- no write-path chaining with reset

## Quickstart
```powershell
cd C:\Users\vlads\Desktop\AN3\Licenta\ubertooth-windows-host
npm run check
npm run status
```

## Command guide
- `npm run help` — show command help
- `npm run status` — human-friendly safe summary
- `npm run version` — concise firmware/API/build summary
- `npm run reset -- --yes` — guarded reboot request with reconnect verification
- `npm run flash -- --file C:\path\to\bluetooth_rxtx.dfu --yes` — guarded wrapper around the official firmware update flow
- `npm run detect` — minimal detection output
- `npm run probe` — driver and readiness metadata
- `npm run transport-check` — WinUSB open + descriptor validation
- `npm run protocol-info` — upstream-backed firmware/build/serial info
- `npm run runtime-info` — upstream-backed getter-only runtime state
- `npm run info` — raw discovery JSON

## Diagnostics
Errors are categorized with stable codes to make GitHub issues less chaotic. See `docs/diagnostics.md`.

## Install / build
See `docs/install.md` for the reproducible Windows setup, `docs/flashing.md` for the guarded firmware workflow boundary, `docs/native-windows-flash-blocker.md` for the current native-Windows status/history, and `npm link` for local CLI usage.

## Release posture
This is a **credible Windows baseline** with a guarded flash wrapper. Native Windows proof-build viability for the official flashing tools is demonstrated, and one sacrificial-device validation run succeeded on Windows. Cleaner user-ready delivery is still a follow-up item. See `docs/release-process.md`, `docs/native-windows-flash-blocker.md`, and `CHANGELOG.md`.

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

## Next recommended work
1. keep reset explicit and guarded
2. keep diagnostics sharp and actionable
3. move to Milestone 3 / capture-export MVP or polish the Windows driver/tool delivery story

See also:
- `docs/quickstart.md`
- `docs/install.md`
- `docs/flashing.md`
- `docs/native-windows-flash-blocker.md`
- `docs/diagnostics.md`
- `docs/release-process.md`
- `docs/reset-safety-review.md`
- `docs/repo-hardening.md`
- `docs/github-launch-checklist.md`
- `docs/milestone-0-implementation.md`
- `docs/protocol-research.md`
- `docs/runtime-research.md`
