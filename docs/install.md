# Install and Build Instructions

## Supported baseline
Current instructions target the safe Windows baseline plus the official guarded flashing flow.

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

## Guarded official flashing usage
Flashing is now supported only through the official `ubertooth-dfu` flow.

Prerequisites:
- a real official `.dfu` image
- the official `ubertooth-dfu` tool on `PATH`, or a full path passed with `--tool`

```powershell
npm run flash -- --file C:\path\to\bluetooth_rxtx.dfu --yes
```

Optional explicit tool path:
```powershell
npm run flash -- --file C:\path\to\bluetooth_rxtx.dfu --tool C:\path\to\ubertooth-dfu.exe --yes
```

See `docs/flashing.md` for recovery steps and official-tool expectations.

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
1. read `docs/flashing.md`
2. confirm the `.dfu` path is correct
3. confirm `ubertooth-dfu` is installed or pass `--tool`
4. if the output mentions `control message unsupported`, recover with official `ubertooth-util -r` or replug the device
