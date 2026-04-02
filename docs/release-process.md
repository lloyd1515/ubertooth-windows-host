# Release Process

## Current release posture
This repo now supports an **official guarded flashing path**, but releases should still frame the project as a carefully bounded Windows baseline rather than full parity.

## Before tagging
1. Run `npm run check`
2. Run `npm run status` on a real device if available
3. If flashing is part of the release message, validate `npm run flash -- --file <official.dfu> --yes` on sacrificial hardware first
4. Confirm README and quickstart still match reality
5. Confirm safety boundary text still limits write behavior to the guarded official flow
6. Confirm no undocumented control-out/write code slipped in

## Tagging
Use semantic-ish tags for milestones, e.g.:
- `v0.1.0`
- `v0.2.0`

## Release notes should include
- what read-only commands are supported
- whether guarded reset is supported
- whether guarded official flashing is supported and how it was verified
- what is still intentionally unsupported
- explicit reminder that undocumented DFU/write paths remain out of scope
