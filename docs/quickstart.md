# Quickstart

## Goal
Use the current repo safely on Windows. Start with read-only diagnostics (`status`), then explore guarded transmission (`tx`, `ducky`) or analysis (`btle`, `scan`), and use the guarded reset/flash flows only when necessary.

## Prerequisites
- Windows host (Node.js 22+)
- Ubertooth One connected over USB
- WinUSB driver bound (use Zadig or `npm run repair`)

## Recommended first run
```powershell
npm test
npm run help
npm run status
npm run duty-cycle
```

## Diagnostics & Discovery
```powershell
npm run detect
npm run probe
npm run protocol-info
npm run runtime-info
```

## Analysis & Capture
```powershell
npm run scan
npm run capture -- --channel 37 --output cap.pcap
npm run btle -- --promisc --pcap capture.pcap
```

## Transmission (Hardware Safety Protocol enforced)
```powershell
# Requires --i-confirm-antenna-is-attached
npm run tx -- --lap <LAP> --i-confirm-antenna-is-attached
npm run ducky -- --quack <UUID> --i-confirm-antenna-is-attached
```

## Firmware & State Changes
```powershell
npm run reset -- --yes
npm run flash -- --file C:\path\to\bluetooth_rxtx.dfu --yes
```

## What success looks like
- `detect` finds `Ubertooth One`
- `status` shows healthy firmware and runtime state
- `duty-cycle` tracks your transmission usage
- `npm run check` passes all 160+ tests

## Safety reminder
Transmission without an antenna can **permanently destroy** your Ubertooth One. Always verify your antenna is attached and observe the 60s/hour duty-cycle limit.
