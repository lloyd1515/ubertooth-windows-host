# Device Safety Policy

## Non-goals
- No default firmware experimentation beyond official safe flows.
- No undocumented writes to device memory.
- No casual parity claims that encourage risky user behavior.

## Guardrails
- Read-only commands land first.
- Flashing requires preflight checks and recovery docs.
- Every risky path needs an explicit confirmation boundary.
- Device/firmware compatibility matrix must be updated before release.
