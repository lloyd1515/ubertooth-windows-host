# Native Windows Official Flashing Status

## Status
The repo now has evidence that the **official Ubertooth flashing tools can be built, executed, validated natively on Windows, and staged through a safer repo-local setup helper**.

What is proven:
- the official source stack can be carried far enough on native Windows to build `ubertooth-dfu.exe` and `ubertooth-util.exe`
- those Windows-built binaries execute successfully
- the Windows-built `ubertooth-util.exe -N` reports the attached device count successfully
- one sacrificial-device flash validation run succeeded on native Windows
- the safer repo-local setup helper stages the validated official Windows-built tools and official firmware asset without auto-installing drivers, silently editing `PATH`, or silently downloading/building dependencies

What is **not** yet proven:
- broader validation breadth across multiple devices / firmware variants
- a full consumer-style installer beyond the safer repo-local setup helper

## Why this matters
The project is Windows-first. WSL may be used for internal testing, but it is **not** the supported runtime path for users.

This native proof, validation, and setup-helper staging mean Milestone 2 no longer needs to stay blocked on Windows viability.

## Proof evidence
### 1. Upstream release story still centers on firmware archives, not Windows host binaries
The official 2020-12-R1 release notes point to a release archive with precompiled firmware and separate build instructions, rather than a documented Windows host-tool distribution:
- https://github.com/greatscottgadgets/ubertooth/releases/tag/2020-12-R1

### 2. Upstream software guidance is Linux-oriented
The official software page says the developers use **GCC on Linux**, and that while “most code should compile on other platforms,” this has **not been done**:
- https://ubertooth.readthedocs.io/en/latest/software.html

### 3. Native Windows/MSYS2 proof build succeeded with minimal proof patches
Using the official 2020-12-R1 source pair on native Windows/MSYS2 UCRT64, the following proof patches were enough to carry the official host toolchain forward:
- replace libbtbb pcap/pcapng sources with proof-build stubs
- add a Windows endian shim in `libubertooth`
- add a minimal Windows signal/alarm shim in `libubertooth`

This produced native Windows binaries for:
- `ubertooth-dfu.exe`
- `ubertooth-util.exe`

### 4. Windows-built official binaries execute successfully
With the required DLL paths present, the native Windows-built binaries successfully executed:
- `ubertooth-dfu.exe -h`
- `ubertooth-util.exe -h`
- `ubertooth-util.exe -N`

The device-count probe returned `1`, proving the Windows-built official tool path can see the attached Ubertooth.

### 5. Native Windows sacrificial-device validation succeeded
Using the official `bluetooth_rxtx.dfu` image from the 2020-12-R1 release archive and the Windows-built official `ubertooth-dfu.exe`, one sacrificial-device validation run succeeded on native Windows.

Observed outcome:
- firmware signature check passed
- firmware transfer completed
- device re-enumerated back to runtime mode
- post-flash `npm run version` reported `2020-12-R1 / 1.07`
- post-flash `npm run status` reported healthy device state

### 6. DFU-mode WinUSB binding is required
During validation, the bootloader device (`usb_bootloader`, `VID_1D50&PID_6003`) initially failed with Windows Problem Code 28 (no driver installed). Native Windows flashing required binding that DFU-mode device to WinUSB before `ubertooth-dfu.exe` could open it.

### 7. Safer repo-local setup helper now stages the validated path
`npm run setup-flash-tools` / `scripts/setup-windows-flash-tools.ps1` now stage the validated repo-local Windows-built official tools and the official firmware image into `build/windows-flash-tools` for cleaner use.

The helper intentionally does **not**:
- install drivers
- silently modify `PATH`
- silently download/build dependencies
- perform hidden admin-wide machine mutation

## Current decision
- **Allowed:** use WSL for investigation / comparison work
- **Not allowed:** treat WSL as the supported flashing/runtime path
- **Current optimization target:** broader validation breadth and post-Milestone-2 follow-up work

## Remaining gaps
Any one of the following would move the project forward:
1. broaden validation breadth across additional devices / firmware variants
2. preserve the proof patches in a cleaner, more maintainable form
3. move on to Milestone 3 / capture-export MVP

## Milestone implication
- **Proven:** native Windows official-tool viability
- **Proven:** one sacrificial-device flash validation run on native Windows
- **Proven:** a safer repo-local setup helper for the validated Windows flashing assets
- **Still open:** broader validation breadth / later milestone work
