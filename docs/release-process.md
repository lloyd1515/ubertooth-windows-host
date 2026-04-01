# Release Process

## Current release posture
This repo is **not** promising flashing or write support yet. Releases should clearly frame the project as a safe read-only Windows baseline.

## Before tagging
1. Run `npm run check`
2. Run `npm run status` on a real device if available
3. Confirm README and quickstart still match reality
4. Confirm safety boundary text still says read-only only
5. Confirm no control-out/write code slipped in

## Tagging
Use semantic-ish tags for milestones, e.g.:
- `v0.1.0`
- `v0.2.0`

## Release notes should include
- what read-only commands are supported
- what was verified on hardware
- what is still intentionally unsupported
- explicit reminder that flashing/DFU are out of scope
