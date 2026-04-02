# Flash Validation Runbook

Use this runbook **before** claiming that the guarded Windows flashing flow is hardware-validated.

## Goal
Prove that `npm run flash -- --file <official.dfu> --yes` works on sacrificial hardware under documented conditions and that recovery steps are good enough for a public release.

## Scope
This runbook validates only:
- Windows host flow
- one attached Ubertooth at a time
- official `.dfu` image
- official `ubertooth-dfu` semantics
- repo guardrails and operator guidance

This runbook does **not** validate:
- multiple attached devices
- unofficial firmware images
- custom DFU tooling
- non-Windows hosts

## Required hardware
- 1 sacrificial Ubertooth One for active flashing
- 1 optional second known-good Ubertooth for control comparison
- stable USB cable
- direct USB port preferred over hubs

## Required software
- Windows host with Node.js/npm working
- this repo checked out locally
- WinUSB binding confirmed
- official Ubertooth release tools available:
  - `ubertooth-dfu`
  - `ubertooth-util`
- official release `.dfu` image

## Evidence artifact
Use this fillable template for each run:
- `flash-validation-report-template.md`

## Evidence to capture
Record all of this in the validation notes:
- date
- Windows version/build
- device serial
- starting firmware/API
- target `.dfu` image name
- whether `ubertooth-dfu` came from PATH or `--tool`
- exact command run
- reconnect time
- full recovery time
- post-flash firmware/API
- whether recovery was needed
- raw CLI output snippets for failures

## Preflight checklist
- [ ] exactly one Ubertooth attached
- [ ] `npm run detect` succeeds
- [ ] `npm run probe` shows ready for read-only WinUSB experiment = yes
- [ ] `npm run version` succeeds and baseline firmware/API is recorded
- [ ] official `.dfu` image path verified
- [ ] official `ubertooth-dfu` is callable
- [ ] official `ubertooth-util -r` is callable for recovery
- [ ] operator has read `docs/flashing.md`

## Recommended baseline capture
Run and save outputs before flashing:
```powershell
npm run detect
npm run probe
npm run version
npm run status
```

## Primary validation flow
### A. Happy-path flash
Run:
```powershell
npm run flash -- --file C:\path\to\bluetooth_rxtx.dfu --yes
```

Pass criteria:
- CLI accepts the command only with `--file` + `--yes`
- official tool output shows DFU switch/signature check behavior
- device disappears briefly and comes back
- CLI waits for re-enumeration instead of returning early
- CLI only reports success after full status recovery
- post-flash `npm run version` reports the expected firmware/API
- post-flash `npm run status` is healthy

### B. Missing file guardrail
Run:
```powershell
node packages/cli/src/index.js flash
```

Pass criteria:
- exits with `E_FLASH_FILE_REQUIRED`
- no hardware side effect occurs

### C. Missing confirmation guardrail
Run:
```powershell
npm run flash -- --file C:\path\to\bluetooth_rxtx.dfu
```

Pass criteria:
- exits with `E_FLASH_CONFIRM_REQUIRED`
- no hardware side effect occurs

### D. Tool path override
If `ubertooth-dfu` is not on PATH, run:
```powershell
npm run flash -- --file C:\path\to\bluetooth_rxtx.dfu --tool C:\path\to\ubertooth-dfu.exe --yes
```

Pass criteria:
- tool override is honored
- results match happy-path expectations

## Recovery validation flow
This section is complete only if you actually hit a recovery case or intentionally test one in a safe way.

### Known recovery case: `control message unsupported`
If the official tool reports this at the end:
1. run official `ubertooth-util -r`
2. if needed, unplug/replug the device
3. run:
   ```powershell
   npm run detect
   npm run version
   npm run status
   ```

Pass criteria:
- operator docs are sufficient to recover the device
- post-recovery version/status become trustworthy again
- the failure is documented with exact observed behavior

## Failure buckets to classify
Use one of these labels in notes:
- `guardrail-blocked`
- `tool-missing`
- `dfu-entry-failed`
- `flash-transfer-failed`
- `reset-recovery-required`
- `reconnect-timeout`
- `post-flash-version-mismatch`
- `post-flash-status-unhealthy`

## Sign-off template
- Device serial:
- Windows version:
- Starting firmware/API:
- Target firmware/API:
- Flash command used:
- Result: pass / fail
- Reconnect wait:
- Full recovery wait:
- Recovery steps needed:
- Notes:

## Release gate interpretation
Do **not** mark Milestone 2 hardware validation complete until at least one sacrificial device has a recorded pass through the happy path, and the recovery playbook has either been exercised or consciously accepted as unverified.
