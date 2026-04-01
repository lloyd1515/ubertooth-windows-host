# Quickstart

## Goal
Use the current repo safely on Windows without touching flashing, DFU, or any write path.

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

## What success looks like
- `detect` finds `Ubertooth One`
- `probe` says read-only WinUSB experiment is ready
- `transport-check` succeeds
- `protocol-info` returns firmware/build/serial info
- `runtime-info` returns getter-only runtime fields

## Safety reminder
Stop if you are about to use anything outside the current CLI. This repo currently does **not** support flashing or any write path.
