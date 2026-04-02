# Experimental Flash Wrapper on Windows

This repo exposes a guarded wrapper around the **official** Ubertooth flashing utility. Native Windows proof-build viability for the official tools is demonstrated, and one sacrificial-device validation run has now succeeded on Windows.

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
- recovery guidance exists

Right now, this repo should **not** claim:
- that the current proof-build/tooling path is already a polished user delivery flow
- that no Windows driver setup is required for DFU mode
- that users should rely on WSL as the supported runtime path

## Requirements for the current Windows path
- Windows host
- Ubertooth attached over USB
- WinUSB binding already working well enough for `npm run probe`
- official Ubertooth host tools installed, with `ubertooth-dfu` available on `PATH`
  - or pass `--tool <full-path-to-ubertooth-dfu.exe>`
- official `.dfu` image from an Ubertooth release archive
- DFU-mode bootloader device (`VID_1D50&PID_6003`) must also be bound to WinUSB for native Windows flashing

## Current operator note
The native Windows path is now proven and validated once on sacrificial hardware, but the DFU driver-binding/tool delivery flow still needs polish before broad end-user rollout.

## Command shape
```powershell
npm run flash -- --file C:\path\to\bluetooth_rxtx.dfu --yes
```

If `ubertooth-dfu.exe` is not on `PATH`:
```powershell
npm run flash -- --file C:\path\to\bluetooth_rxtx.dfu --tool C:\path\to\ubertooth-dfu.exe --yes
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
- install the official Ubertooth release tools
- add the tool directory to `PATH`
- or pass `--tool` explicitly

### DFU mode appears but flashing tool cannot open the device
- verify that the DFU bootloader device (`usb_bootloader`, `VID_1D50&PID_6003`) is bound to WinUSB
- if Windows shows driver Problem Code 28 for PID 6003, native flashing will fail until that DFU driver is installed

### Output ends with `control message unsupported`
The official docs treat this as a **reset/reconnect problem at the end**, not necessarily a failed firmware write.

Recovery:
1. run official `ubertooth-util -r` from the same release tools
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
