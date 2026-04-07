# capture-export

Phase 1 target:
- prove a Windows-friendly capture/export workflow
- prioritize reliable export over fancy live UX

Phase 2 target:
- improve live inspection and Wireshark ergonomics

## Milestone 3 MVP shape
- CLI first
- live terminal inspector first
- raw output first
- one reliable mode first
- file export second

The first slice is a Windows-friendly raw BLE live inspector modeled after
upstream `ubertooth-btle -f`.

## Known-good command
```powershell
npm run capture -- --channel 37 --timeout-seconds 10
```

What it does:
- runs the repo-local Windows-built `ubertooth-btle.exe` by default
- uses upstream follow mode (`-f`)
- optionally pins one advertising channel (`37`, `38`, or `39`)
- prints raw live output directly to the terminal
- can auto-stop after a short bounded interval for reproducible verification

## Current limitations
- this is not file-export-first yet
- this is not promiscuous-mode support
- this is not broad all-mode BLE parity
- the raw upstream-style output may include partial decode noise such as `attempt to read past end of buffer`; this MVP is intentionally terminal-first and not a polished decoder yet
- Linux parity gaps remain and should be recorded explicitly as the MVP evolves

## File export

The `--output` flag saves raw capture output to a file while still streaming
live to the terminal:

```powershell
npm run capture -- --channel 37 --timeout-seconds 10 --output capture.txt
```

What it does:
- tees child stdout to both the terminal and the specified file
- validates the output directory exists before spawning
- reports the file path and byte count on completion
- works with `--timeout-seconds` for bounded, reproducible exports

The exported file contains the same raw upstream output shown in the terminal.
No format conversion (pcap, pcapng) is applied — this is raw text export.

## Next slice
- format conversion (pcap/pcapng) once raw export is validated
