# Changelog

## [0.2.0] - 2026-04-07

### Added
- **Transmission Support (TX)**: Raw symbol transmission via `ubertooth-tx`.
- **Uberducky Support**: Rubber Ducky emulation via `ubertooth-ducky`.
- **Hardware Safety Protocol**: 
  - Mandatory antenna confirmation flag (`--i-confirm-antenna-is-attached`) for all TX commands.
  - Rolling-hour duty-cycle enforcement (60s limit) to prevent CC2591 thermal damage.
- **Guarded Flash Wrapper**: Experimental official firmware update flow via `ubertooth-dfu`.
- **BLE Analysis Tools**: Wrappers for `ubertooth-btle` (sniffing, following, interference).
- **Native Windows BLE Scanning**: Hardware-bridged scanning via `scan` and `follow` commands (no BlueZ required).
- **Classic BT Discovery**: Passive discovery via `ubertooth-rx`, `ubertooth-dump`, and `ubertooth-afh`.
- **Automated Repair**: `repair` command for WinUSB driver/binding recovery.

### Fixed
- Fixed flaky test cleanup on Windows for `capture-export`.
- Corrected `ubertoothExeRunner` test expectations for JS stream output.

### Changed
- Shifted from "read-only baseline" to "Guarded-Write & TX-Ready" posture.
- Safety boundary now includes explicit hardware protection layers (Antenna + Thermal).

## [0.1.0] - 2026-04-02

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
