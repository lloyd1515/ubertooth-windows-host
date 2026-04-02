# Install and Build Instructions

## Supported baseline
Current instructions target the safe Windows baseline. The guarded flash wrapper exists, native Windows proof-build viability for the official flashing toolchain is demonstrated, one sacrificial-device validation run succeeded, and the repo now includes a safer setup helper for staging the validated Windows flashing assets.

## Requirements
- Windows host
- Node.js 22+
- npm 10+
- Ubertooth connected over USB with WinUSB binding

## Clone and run locally
```powershell
git clone https://github.com/lloyd1515/ubertooth-windows-host.git
cd ubertooth-windows-host
npm run check
npm run status
```

## Optional local CLI install
To expose the CLI command name on your machine without publishing to npm yet:
```powershell
npm link
ubertooth-windows-host help
ubertooth-windows-host status
```

## Reproducible validation sequence
```powershell
npm run check
npm run detect
npm run version
npm run probe
npm run transport-check
npm run protocol-info
npm run runtime-info
```

## Guarded reset usage
Reset is no longer blocked, but it is still intentionally guarded because it reboots the device.

```powershell
npm run reset -- --yes
```

Expected behavior:
- the device may disconnect briefly
- the control transfer may look interrupted
- the CLI waits for the device to reappear and for protocol access to settle again

## Windows flash setup helper
Use the safer repo-local setup helper before native flashing:

```powershell
npm run setup-flash-tools
```

This runs:
- `scripts/setup-windows-flash-tools.ps1`

What it does:
- validates the repo-local Windows-built official tools already evidenced by the project
- stages the validated Windows-built official tools into `build/windows-flash-tools`
- points users at the repo-local official `bluetooth_rxtx.dfu` asset path
- prints explicit next-step flash/recovery commands
- writes a manifest describing the staged tool paths and firmware path

What it does **not** do:
- install drivers
- modify `PATH`
- download or build dependencies
- perform hidden admin-required machine-wide changes

Important manual note:
- if the device enters DFU mode as `VID_1D50&PID_6003`, binding that bootloader device to WinUSB is still a manual prerequisite before native flashing

## Experimental guarded flash wrapper
The CLI wrapper for the official `ubertooth-dfu` flow exists. Native Windows proof-build viability is demonstrated, one sacrificial-device validation run succeeded, and the setup helper now stages the validated repo-local tool path for cleaner use.

Prerequisites:
- a real official `.dfu` image
- either the staged helper output under `build/windows-flash-tools` or the official `ubertooth-dfu` tool on `PATH`

Using the staged helper output:
```powershell
npm run setup-flash-tools
node packages/cli/src/index.js flash --file .\official-release\ubertooth-2020-12-R1\ubertooth-one-firmware-bin\bluetooth_rxtx.dfu --tool .\build\windows-flash-tools\ubertooth-dfu.exe --yes
```

Optional explicit tool path:
```powershell
npm run flash -- --file C:\path\to\bluetooth_rxtx.dfu --tool C:\path\to\ubertooth-dfu.exe --yes
```

See:
- `docs/flashing.md`
- `docs/native-windows-flash-blocker.md`

## What is intentionally not supported yet
- undocumented DFU/write paths outside the guarded official flash flow
- write/control-out paths other than guarded reset and guarded official flash
- capture/sniffing

## Troubleshooting
If `status` fails:
1. run `npm run detect`
2. run `npm run probe`
3. confirm the device is bound to WinUSB
4. include the CLI error code in any GitHub issue

If `flash` fails:
1. run `npm run setup-flash-tools`
2. read `docs/flashing.md`
3. read `docs/native-windows-flash-blocker.md`
4. confirm the `.dfu` path is correct
5. confirm `ubertooth-dfu` is staged or pass `--tool`
6. if the output mentions `control message unsupported`, recover with official `ubertooth-util -r` or replug the device
