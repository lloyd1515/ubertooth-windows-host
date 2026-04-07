# Upstream Compatibility Notes

## Goal
Preserve compatibility with upstream Ubertooth command semantics and safe flashing behavior as much as practical while delivering a Windows-first experience.

## Command Parity Status

| Upstream Tool | Status | Windows Implementation | Notes |
|---------------|--------|-------------------------|-------|
| `ubertooth-btle` | ✅ Partial | Wrapper (`packages/capture-export`) | Adv channels 37-39, PCAP export, RSSI, Follow (-C) |
| `ubertooth-util` | ✅ Partial | Wrapper (`packages/cli`) | Getters (info, version, reset) |
| `ubertooth-specan` | ✅ Full | Wrapper (`packages/cli`) | Spectrum analyzer |
| `ubertooth-rx` | ✅ Full | Wrapper (`packages/cli`) | Classic BT discovery |
| `ubertooth-dump` | ✅ Full | Wrapper (`packages/cli`) | Raw bit stream dump |
| `ubertooth-afh` | ✅ Full | Wrapper (`packages/cli`) | AFH channel map detection |
| `ubertooth-scan` | ✅ Full | Native (`packages/ble-scanner`) | Reimplemented via `noble` (no BlueZ required) |
| `ubertooth-follow` | ✅ Full | Native (`packages/ble-scanner`) | Reimplemented via `noble` (no BlueZ required) |
| `ubertooth-dfu` | ✅ Full | Wrapper (`packages/core-usb`) | Guarded firmware updates |
| `ubertooth-tx` | ❌ Deferred | None | Legal/Safety risk (Active TX) |
| `ubertooth-ducky` | ❌ Deferred | None | Legal/Safety risk (Injection) |
| `ubertooth-debug` | ❌ Pending | None | Requires manual build of debug tool |

## Working rules
- Prefer semantic compatibility over literal code duplication.
- **Native over Port**: For tools requiring BlueZ (like `scan`), reimplement using Windows-native APIs (`noble`) to avoid heavy dependencies.
- **Guardrails**: All state-changing or high-risk operations must be explicitly guarded.
- Track upstream release assumptions in this file.
- Record any intentional divergence with rationale and user impact.

