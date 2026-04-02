# Flash Validation Report Template

Copy this file for each sacrificial-device validation run.

## Metadata
- Validation date:
- Operator:
- Repo commit:
- Windows version/build:
- Host machine:

## Device under test
- Device model:
- Device serial:
- USB port/path used:
- Cable/hub notes:
- Sacrificial device confirmed: yes / no

## Firmware/tooling
- Starting firmware revision:
- Starting API version:
- Target `.dfu` image:
- Target firmware/API expectation:
- `ubertooth-dfu` source: PATH / --tool
- `ubertooth-dfu` version/path:
- `ubertooth-util` version/path:

## Preflight checklist
- [ ] exactly one Ubertooth attached
- [ ] `npm run detect` passed
- [ ] `npm run probe` passed and device is ready
- [ ] `npm run version` baseline captured
- [ ] `npm run status` baseline captured
- [ ] official `.dfu` path verified
- [ ] `ubertooth-dfu` callable
- [ ] `ubertooth-util -r` callable
- [ ] operator reviewed `docs/flashing.md`
- [ ] operator reviewed `packages/compat-lab/flash-validation-runbook.md`

## Baseline evidence
### `npm run detect`
```text
[paste output]
```

### `npm run probe`
```text
[paste output]
```

### `npm run version`
```text
[paste output]
```

### `npm run status`
```text
[paste output]
```

## Guardrail checks
### Missing file guardrail
Command:
```powershell
node packages/cli/src/index.js flash
```
Observed result:
- Exit code / error code:
- Notes:

### Missing confirmation guardrail
Command:
```powershell
npm run flash -- --file C:\path\to\bluetooth_rxtx.dfu
```
Observed result:
- Exit code / error code:
- Notes:

## Primary flash run
Command used:
```powershell
npm run flash -- --file C:\path\to\bluetooth_rxtx.dfu --yes
```

Observed CLI output:
```text
[paste output]
```

## Timing
- Reconnect wait:
- Full recovery wait:
- Additional manual wait needed: yes / no

## Post-flash evidence
### `npm run version`
```text
[paste output]
```

### `npm run status`
```text
[paste output]
```

## Recovery path
- Was recovery needed: yes / no
- Failure bucket:
  - `guardrail-blocked`
  - `tool-missing`
  - `dfu-entry-failed`
  - `flash-transfer-failed`
  - `reset-recovery-required`
  - `reconnect-timeout`
  - `post-flash-version-mismatch`
  - `post-flash-status-unhealthy`
- Recovery command(s) used:
- Recovery observations:

## Result
- Overall result: pass / fail
- Matches expected target firmware/API: yes / no
- Device healthy after run: yes / no
- Public-release evidence quality: sufficient / insufficient

## Notes
- Operator notes:
- Unexpected behavior:
- Follow-up actions:
