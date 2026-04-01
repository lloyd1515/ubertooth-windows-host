# Changelog

## v0.1.0 - Safe Windows read-only baseline

Initial public baseline for a Windows-first Ubertooth host workflow that stays strictly in read-only territory.

### Added
- Windows device detection via PnP/WMI
- readiness probing for WinUSB-bound devices
- safe read-only WinUSB transport validation
- official-source-backed protocol info reads
- official-source-backed runtime getter reads
- human-friendly `status` command
- diagnostics/error taxonomy
- CI + release dry-run workflows
- public-repo docs and launch checklist

### Safety boundary
- No control-out writes
- No DFU
- No flashing
- No runtime mode changes
