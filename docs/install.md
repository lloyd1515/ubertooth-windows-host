# Install and Build Instructions

## Supported baseline
Current instructions target the safe Windows baseline only.

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

## What is intentionally not supported yet
- flashing
- DFU
- write/control-out paths other than guarded reset
- capture/sniffing

## Troubleshooting
If `status` fails:
1. run `npm run detect`
2. run `npm run probe`
3. confirm the device is bound to WinUSB
4. include the CLI error code in any GitHub issue
