# Quickstart

## Goal
Use the current repo safely on Windows for read-only checks first, then the guarded reset/official flash flows only when you intentionally need them.

## Prerequisites
- Windows host
- Node.js + npm available
- Ubertooth connected over USB
- WinUSB binding already present

## Recommended first run
```powershell
npm test
npm run help
npm run status
```

## If you want more detail
```powershell
npm run detect
npm run probe
npm run transport-check
npm run protocol-info
npm run runtime-info
```

## If you intentionally need firmware update
```powershell
npm run flash -- --file C:\path\to\bluetooth_rxtx.dfu --yes
```

Read `docs/flashing.md` first so you have the recovery steps ready.

## What success looks like
- `detect` finds `Ubertooth One`
- `probe` says read-only WinUSB experiment is ready
- `transport-check` succeeds
- `protocol-info` returns firmware/build/serial info
- `runtime-info` returns getter-only runtime fields
- `flash` only reports success after the device comes back healthy again

## Safety reminder
Stop if you are about to use anything outside the current CLI or outside the official Ubertooth firmware tooling. This repo intentionally exposes only guarded reset plus the official guarded flash path.
