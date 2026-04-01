# Ubertooth Windows Host

Windows-first host tooling scaffold for Ubertooth, aimed at safe public use and phased progress toward Linux feature parity.

## What this repo can do today
This repo currently supports a **safe read-only Windows baseline** for Ubertooth One:
- detect the device on Windows
- inspect driver/binding/readiness metadata
- prove read-only WinUSB transport access
- read official firmware/version/build/board/serial/part information
- read official getter-only runtime state (LEDs, channel, modulation, PA flags, squelch, clock)

## Safety boundary
Current commands are intentionally limited to:
- **control-IN only** reads
- no control-out writes
- no DFU
- no flashing
- no runtime mode changes

## Quickstart
```powershell
cd C:\Users\vlads\Desktop\AN3\Licenta\ubertooth-windows-host
npm test
npm run help
npm run status
```

## Command guide
- `npm run help` — show command help
- `npm run status` — human-friendly safe summary
- `npm run detect` — minimal detection output
- `npm run probe` — driver and readiness metadata
- `npm run transport-check` — WinUSB open + descriptor validation
- `npm run protocol-info` — upstream-backed firmware/build/serial info
- `npm run runtime-info` — upstream-backed getter-only runtime state
- `npm run info` — raw discovery JSON

## Diagnostics
Errors are categorized with stable codes to make GitHub issues less chaotic. See `docs/diagnostics.md`.

## Release posture
This is a **credible proofed baseline**, not a full Windows replacement for the Linux toolchain. Releases should clearly state that flashing and write paths are still out of scope. See `docs/release-process.md`.

## Public-repo framing
The project has proven that Windows can safely:
- enumerate the device
- bind via WinUSB
- open the device read-only
- speak official getter-only protocol requests

## Next recommended work
1. polish install/docs/release UX
2. keep diagnostics sharp and actionable
3. only add new commands after official-source review confirms they are still read-only and low-risk

See also:
- `docs/quickstart.md`
- `docs/diagnostics.md`
- `docs/release-process.md`
- `docs/github-launch-checklist.md`
- `docs/milestone-0-implementation.md`
- `docs/protocol-research.md`
- `docs/runtime-research.md`
