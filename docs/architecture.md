# Architecture Overview

## Modules
### `packages/core-usb`
Windows transport layer for enumeration, handle management, timeouts, retries, and safe reset sequencing.

### `packages/core-protocol`
Host/device command semantics aligned with upstream behavior wherever possible.

### `packages/cli`
Human-facing command layer: detect, info, version, reset, flash, capture.

### `packages/capture-export`
Windows-friendly export path for BLE capture inspection.

### `packages/compat-lab`
Device matrix, smoke suite definitions, and reproducible hardware validation notes.

## Phase ordering
1. Read-only host comms
2. Safe reset/config
3. Official flashing path with guardrails
4. Capture/export MVP
5. Public hardening and parity expansion
