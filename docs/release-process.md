# Release Process

## Current release posture
This repo has an **experimental guarded flash wrapper**. Native Windows proof-build viability for the official tools is demonstrated, one sacrificial-device validation run succeeded, and a safer repo-local Windows setup helper now stages the validated flashing assets. Releases should still avoid broad claims beyond the validated Windows-first story and keep DFU driver binding explicit/manual.

## Before tagging
1. Run `npm run check`
2. Run `npm run setup-flash-tools` and confirm the staged asset paths/output still match the docs
3. Run `npm run status` on a real device if available
4. If flashing is part of the release message, confirm the existing sacrificial validation report is still the accepted proof artifact
5. Only rerun `npm run flash -- --file <official.dfu> --yes` on sacrificial hardware if the setup helper materially changed the actual DFU binary, staging path, or guarded flash invocation contract
6. Confirm README and install/flashing docs still match reality
7. Confirm safety boundary text still limits write behavior to the guarded official flow
8. Confirm no undocumented control-out/write code slipped in
9. Confirm the repo-root `LICENSE` file is committed and `gh repo view --json licenseInfo` reports the expected GPL license

## Tagging
Use semantic-ish tags for milestones, e.g.:
- `v0.1.0`
- `v0.2.0`

## Release notes should include
- what read-only commands are supported
- whether guarded reset is supported
- that native Windows proof-build viability for the official tools exists
- that one sacrificial-device flashing run is validated on Windows
- that `npm run setup-flash-tools` / `scripts/setup-windows-flash-tools.ps1` stage the validated repo-local flashing assets
- what is still intentionally unsupported
- explicit reminder that DFU driver binding remains a manual Windows step
- explicit reminder that undocumented DFU/write paths remain out of scope
