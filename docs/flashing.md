# Official Flashing on Windows

This repo now exposes a guarded wrapper around the **official** Ubertooth flashing utility.

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

## Requirements
- Windows host
- Ubertooth attached over USB
- WinUSB binding already working well enough for `npm run probe`
- official Ubertooth host tools installed, with `ubertooth-dfu` available on `PATH`
  - or pass `--tool <full-path-to-ubertooth-dfu.exe>`
- official `.dfu` image from an Ubertooth release archive

## Recommended command
```powershell
npm run flash -- --file C:\path\to\bluetooth_rxtx.dfu --yes
```

If `ubertooth-dfu.exe` is not on `PATH`:
```powershell
npm run flash -- --file C:\path\to\bluetooth_rxtx.dfu --tool C:\path\to\ubertooth-dfu.exe --yes
```

## Hardware validation runbook
Before calling this path hardware-validated, run:
- `packages/compat-lab/flash-validation-runbook.md`
- `packages/compat-lab/flash-validation-report-template.md`

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
