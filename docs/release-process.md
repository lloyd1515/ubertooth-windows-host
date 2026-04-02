# Release Process

## Current release posture
This repo has an **experimental guarded flash wrapper**. Native Windows proof-build viability for the official tools is now demonstrated, but releases should still avoid broad Windows flashing claims until sacrificial-device validation and a cleaner delivery path are in place.

## Before tagging
1. Run `npm run check`
2. Run `npm run status` on a real device if available
3. If flashing is part of the release message, first verify the native Windows official-tool proof/build path is available and documented
4. Then validate `npm run flash -- --file <official.dfu> --yes` on sacrificial hardware
5. Confirm README and quickstart still match reality
6. Confirm safety boundary text still limits write behavior to the guarded official flow
7. Confirm no undocumented control-out/write code slipped in

## Tagging
Use semantic-ish tags for milestones, e.g.:
- `v0.1.0`
- `v0.2.0`

## Release notes should include
- what read-only commands are supported
- whether guarded reset is supported
- that native Windows proof-build viability for the official tools exists
- whether sacrificial-device flashing is actually validated or still experimental
- what is still intentionally unsupported
- explicit reminder that undocumented DFU/write paths remain out of scope
