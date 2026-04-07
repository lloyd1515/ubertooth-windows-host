# Support Matrix

## Validated Windows Versions

| Windows Version | Build | Status | Notes |
|-----------------|-------|--------|-------|
| Windows 11 22H2+ | 22621+ | ✅ Validated | Primary development platform |
| Windows 11 23H2  | 22631+ | ✅ Validated | WinUSB + Node 22 confirmed |
| Windows 10 22H2  | 19045 | ✅ Validated | WinUSB functional, same driver path |
| Windows 10 21H2  | 19044 | ⚠️ Expected | No blocking API differences known |
| Windows 10 LTSC  | —     | ⚠️ Expected | Zadig/WinUSB path identical |
| Windows Server 2022 | — | ❓ Untested | USB passthrough may differ in VMs |

## Validated Node.js Versions

| Node Version | Status | Notes |
|--------------|--------|-------|
| Node 22 LTS  | ✅ Required | Minimum; uses `node:test` built-in runner |
| Node 23      | ✅ Compatible | No known issues |
| Node 20 LTS  | ❌ Unsupported | Missing `node:test` features used |
| Node 18 LTS  | ❌ Unsupported | ESM + `node:test` gaps |

## Validated Ubertooth One Firmware

| Firmware Version | USB PID | Status | Notes |
|-----------------|---------|--------|-------|
| 2020-12-R1      | 0x6002  | ✅ Validated | Official release; primary target |
| DFU mode        | 0x6003  | ✅ Validated | Detected and handled by CLI |
| Custom builds   | 0x6002  | ⚠️ Expected | Getter protocol is stable across versions |

## USB Driver Requirements

| Requirement | Value |
|-------------|-------|
| Driver | WinUSB (via Zadig) |
| Zadig version | 2.8+ recommended |
| VID | 0x1D50 |
| PID (normal) | 0x6002 |
| PID (DFU)    | 0x6003 |
| Interface | Interface 0 |

## npm Package Requirements

| Package | Version | Notes |
|---------|---------|-------|
| usb     | ^2.13.0 | WinUSB bindings for Node |
| node    | >=22    | Native test runner + ESM |

## Known Limitations

- **Linux/macOS**: Not supported. This is a Windows-first project by design.
- **WSL2**: USB passthrough requires `usbipd-win`; not officially supported or tested.
- **Virtual machines**: USB passthrough varies by hypervisor; not officially supported.
- **Firmware older than 2020-12-R1**: Getter protocol may differ; untested.

## Test Platform

Primary validation hardware:

- Device: Ubertooth One (Great Scott Gadgets)
- Firmware: 2020-12-R1 (official release)
- Host OS: Windows 11 23H2
- Node: 22 LTS
- Driver: WinUSB via Zadig 2.9
