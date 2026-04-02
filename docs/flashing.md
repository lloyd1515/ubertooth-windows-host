# Experimental Flash Wrapper on Windows

This repo exposes a guarded wrapper around the **official** Ubertooth flashing utility. Native Windows proof-build viability for the official tools is demonstrated, one sacrificial-device validation run has now succeeded on Windows, and `npm run setup-flash-tools` / `scripts/setup-windows-flash-tools.ps1` now stage the validated repo-local DFU tools into `build/windows-flash-tools` while pointing users at the repo-local official firmware asset path.

Read this first:
- `docs/native-windows-flash-blocker.md`

## What this command does
`npm run flash` does **not** implement a custom firmware writer.

It:
1. requires an explicit `--yes`
2. requires a real `.dfu` image path via `--file`
3. checks that exactly one Ubertooth is attached
4. checks that the device is probe-ready before writing firmware
5. calls the official `ubertooth-dfu -d <image> -r`
6. waits for the device to reappear
7. waits for version/status reads to settle again before reporting success

## Current boundary
Right now, this repo can honestly claim:
- the guarded flash wrapper exists
- the official tool semantics are modeled
- native Windows proof-build viability for the official tools is demonstrated
- one sacrificial-device validation run succeeded on native Windows
- a safer repo-local setup helper stages the validated Windows DFU tools into `build/windows-flash-tools` and points to the repo-local official firmware asset
- recovery guidance exists

Right now, this repo should **not** claim:
- that no Windows driver setup is required for DFU mode
- that users should rely on WSL as the supported runtime path
- that the setup helper silently changes machine-wide state on the user's behalf

## Requirements for the current Windows path
- Windows host
- Ubertooth attached over USB
- WinUSB binding already working well enough for `npm run probe`
- either:
  - the staged repo-local helper output under `build/windows-flash-tools`, or
  - official Ubertooth host tools installed with `ubertooth-dfu` available on `PATH`, or
  - an explicit `--tool <full-path-to-ubertooth-dfu.exe>` path
- official `.dfu` image from an Ubertooth release archive (the setup helper prints the repo-local validated firmware path for you)
- DFU-mode bootloader device (`VID_1D50&PID_6003`) must also be bound to WinUSB for native Windows flashing

## Current operator note
The native Windows path is now proven and validated once on sacrificial hardware, and the safer setup helper stages the validated repo-local DFU tools for cleaner use while surfacing the official firmware path explicitly. DFU driver-binding remains explicit/manual before broad end-user rollout.

## Command shape
Using the staged helper output:
```powershell
npm run setup-flash-tools
node packages/cli/src/index.js flash --file .\official-release\ubertooth-2020-12-R1\ubertooth-one-firmware-bin\bluetooth_rxtx.dfu --tool .\build\windows-flash-tools\ubertooth-dfu.exe --yes
```

If `ubertooth-dfu.exe` is already on `PATH`:
```powershell
npm run flash -- --file C:\path\to\bluetooth_rxtx.dfu --yes
```

## Hardware validation runbook
The native Windows path has now completed one sacrificial-device validation run. Continue to use:
- `packages/compat-lab/flash-validation-runbook.md`
- `packages/compat-lab/flash-validation-report-template.md`
- `packages/compat-lab/reports/flash-validation-20260402T091212Z.md`

## Expected output flow
- the device switches toward DFU mode
- the official tool checks the firmware signature
- the device disappears briefly
- the CLI waits for re-enumeration
- the CLI waits for read-only status/version recovery
- success is only reported after the device comes back healthy

## Recovery playbook
### `ubertooth-dfu` is missing
- run `npm run setup-flash-tools`
- use the staged `build/windows-flash-tools\ubertooth-dfu.exe` path with `--tool`
- or if you intentionally use a different official tool install, pass `--tool` explicitly

### DFU mode appears but flashing tool cannot open the device
- verify that the DFU bootloader device (`usb_bootloader`, `VID_1D50&PID_6003`) is bound to WinUSB
- if Windows shows driver Problem Code 28 for PID 6003, native flashing will fail until that DFU driver is installed

### Output ends with `control message unsupported`
The official docs treat this as a **reset/reconnect problem at the end**, not necessarily a failed firmware write.

Recovery:
1. run official `ubertooth-util -r` from the same release tools (the setup helper stages it in `build/windows-flash-tools`)
2. if that is unavailable, unplug/replug the device
3. run:
   ```powershell
   npm run version
   npm run status
   ```

### Device does not come back in time
1. unplug/replug the device
2. run `npm run detect`
3. run `npm run probe`
4. run `npm run version`
5. if the device is still unhealthy, fall back to the official Ubertooth firmware recovery instructions

## Official reference
The upstream docs describe the supported flashing command as:

```text
ubertooth-dfu -d bluetooth_rxtx.dfu -r
```

See the official firmware guide:
- https://ubertooth.readthedocs.io/en/latest/firmware.html
