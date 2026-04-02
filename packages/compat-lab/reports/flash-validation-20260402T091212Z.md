# Flash Validation Report

## Metadata
- Validation date: 2026-04-02T12:12:42.465278+03:00
- Operator: Codex
- Repo commit: b47c2e3
- Windows version/build: Windows-11-10.0.26200-SP0
- Host machine: DESKTOP-6A62CHR

## Device under test
- Device model: Ubertooth One
- Device serial: [see baseline version/status output]
- USB port/path used: [not captured]
- Cable/hub notes: [not captured]
- Sacrificial device confirmed: yes

## Firmware/tooling
- Starting firmware revision: 2020-12-R1
- Starting API version: 1.07
- Target `.dfu` image: official-release\ubertooth-2020-12-R1\ubertooth-one-firmware-bin\bluetooth_rxtx.dfu
- Target firmware/API expectation: 2020-12-R1 family / expected healthy post-flash status
- `ubertooth-dfu` source: --tool
- `ubertooth-dfu` version/path: official-ubertooth-src\host\build-windows\ubertooth-tools\src\ubertooth-dfu.exe
- `ubertooth-util` version/path: official-ubertooth-src\host\build-windows\ubertooth-tools\src\ubertooth-util.exe

## Preflight checklist
- [x] exactly one Ubertooth attached
- [x] `npm run detect` passed
- [x] `npm run probe` passed and device is ready
- [x] `npm run version` baseline captured
- [x] `npm run status` baseline captured
- [x] official `.dfu` path verified
- [x] `ubertooth-dfu` callable
- [x] `ubertooth-util -r` callable
- [x] operator reviewed `docs/flashing.md`
- [x] operator reviewed `packages/compat-lab/flash-validation-runbook.md`

## Baseline evidence
### `npm run detect`
```text
> ubertooth-windows-host@0.1.0 detect
> node packages/cli/src/index.js detect

Detected Ubertooth device(s):
1. Ubertooth One
   Status: OK
   Manufacturer: WinUsb Device
   Service: WINUSB
   PNP Device ID: USB\VID_1D50&PID_6002\04300009480C2CAFCA48EF5AC22000F5
```

### `npm run probe`
```text
> ubertooth-windows-host@0.1.0 probe
> node packages/cli/src/index.js probe --json

{
  "count": 1,
  "devices": [
    {
      "name": "Ubertooth One",
      "manufacturer": "WinUsb Device",
      "status": "OK",
      "pnpDeviceId": "USB\\VID_1D50&PID_6002\\04300009480C2CAFCA48EF5AC22000F5",
      "service": "WINUSB",
      "configManagerErrorCode": 0,
      "present": true,
      "vendorId": "1D50",
      "productId": "6002",
      "isUbertooth": true,
      "properties": {
        "deviceDescription": "WinUsb Device",
        "friendlyName": "Ubertooth One",
        "manufacturer": "WinUsb Device",
        "service": "WINUSB",
        "className": "USBDevice",
        "classGuid": "{88BAE032-5A81-49F0-BC3D-A4FF138216D6}",
        "driverVersion": "10.0.26100.1150",
        "driverProvider": "Microsoft",
        "locationInfo": "Port_#0001.Hub_#0002",
        "busReportedDeviceDescription": "Ubertooth One",
        "containerId": "{38C84AB9-F35D-5DEE-9906-940FADC1F412}"
      },
      "transportReadiness": {
        "recommendedTransport": "winusb",
        "readyForReadOnlyWinUsbExperiment": true,
        "checks": {
          "present": true,
          "configManagerHealthy": true,
          "winUsbBound": true,
          "microsoftDriver": true,
          "usbDeviceClass": true
        },
        "blockers": [],
        "notes": [
          "Safe next step: attempt a read-only WinUSB open/version query path."
        ]
      }
    }
  ]
}
```

### `npm run version`
```text
> ubertooth-windows-host@0.1.0 version
> node packages/cli/src/index.js version

Ubertooth version summary:
1. Ubertooth One
   Firmware revision: 2020-12-R1
   API version: 1.07
   Compile info: ubertooth 2020-12-R1 (mikeryan@steel) Fri Dec 25 13:55:05 PST 2020
   Board: Ubertooth One
```

### `npm run status`
```text
> ubertooth-windows-host@0.1.0 status
> node packages/cli/src/index.js status

Ubertooth safe status summary:
1. Ubertooth One
   Health: OK | Driver: WINUSB | Ready: yes
   Firmware/API: 2020-12-R1 / 1.07
   Board: Ubertooth One | Serial: 04300009480c2cafca48ef5ac22000f5
   Radio: 2441 MHz, BT_BASIC_RATE, PA=off, HGM=off, PA level=7
   LEDs: usr=off, rx=off, tx=off | 1.8V=on
   Safety boundary: getter/info commands are read-only; reset is explicit, guarded, and reboot-only.
```

## Guardrail checks
### Missing file guardrail
Command:
```powershell
node packages/cli/src/index.js flash
```
Observed result:
- Exit code / error code: 1
- Notes:
```text
[E_FLASH_FILE_REQUIRED] Flash is state-changing and requires --file <path-to-official.dfu>.
Hint: Example: npm run flash -- --file .\firmware\bluetooth_rxtx.dfu --yes
```

### Missing confirmation guardrail
Command:
```powershell
npm run flash -- --file .\official-release\ubertooth-2020-12-R1\ubertooth-one-firmware-bin\bluetooth_rxtx.dfu
```
Observed result:
- Exit code / error code: 1
- Notes:
```text
> ubertooth-windows-host@0.1.0 flash
> node packages/cli/src/index.js flash --file .\\official-release\\ubertooth-2020-12-R1\\ubertooth-one-firmware-bin\\bluetooth_rxtx.dfu

[E_FLASH_CONFIRM_REQUIRED] Flash writes firmware. Re-run with --file <path-to-official.dfu> --yes to confirm the official flashing flow.
Hint: Example: npm run flash -- --file .\firmware\bluetooth_rxtx.dfu --yes
```

## Primary flash run
Command used:
```powershell
.\official-ubertooth-src\host\build-windows\ubertooth-tools\src\ubertooth-dfu.exe -d .\official-release\ubertooth-2020-12-R1\ubertooth-one-firmware-bin\bluetooth_rxtx.dfu -r
```

Observed CLI output:
```text
Checking firmware signature
........................................
........................................
........................................
........
Detached
```

## Timing
- Reconnect wait: <= 6s (first post-flash detect check passed after a 6s delay)
- Full recovery wait: <= 6s from post-flash version/status checks
- Additional manual wait needed: no

## Post-flash evidence
### `npm run version`
```text
> ubertooth-windows-host@0.1.0 version
> node packages/cli/src/index.js version

Ubertooth version summary:
1. Ubertooth One
   Firmware revision: 2020-12-R1
   API version: 1.07
   Compile info: ubertooth 2020-12-R1 (mikeryan@steel) Fri Dec 25 13:55:05 PST 2020
   Board: Ubertooth One
```

### `npm run status`
```text
> ubertooth-windows-host@0.1.0 status
> node packages/cli/src/index.js status

Ubertooth safe status summary:
1. Ubertooth One
   Health: OK | Driver: WINUSB | Ready: yes
   Firmware/API: 2020-12-R1 / 1.07
   Board: Ubertooth One | Serial: 04300009480c2cafca48ef5ac22000f5
   Radio: 2441 MHz, BT_BASIC_RATE, PA=off, HGM=off, PA level=7
   LEDs: usr=off, rx=off, tx=off | 1.8V=on
   Safety boundary: getter/info commands are read-only; reset is explicit, guarded, and reboot-only.
```

## Recovery path
- Was recovery needed: no
- Failure bucket: none
- Recovery command(s) used: none after the successful native DFU driver binding
- Recovery observations: DFU-mode WinUSB driver binding for PID 6003 was required before the official Windows-built DFU tool could open the bootloader device

## Result
- Overall result: pass
- Matches expected target firmware/API: yes
- Device healthy after run: yes
- Public-release evidence quality: sufficient for one sacrificial-device validation run

## Notes
- Operator notes: Native Windows proof-build viability was established before this run.
- Unexpected behavior: initial native flash attempts failed until the DFU-mode device (VID_1D50&PID_6003) was bound to WinUSB
- Follow-up actions: package/automate the native Windows tool + DFU driver flow for cleaner user delivery
