# Test Strategy

Mirror the OMX test spec with repo-facing language.

## Must-have coverage
- Unit: protocol serialization, CLI validation, error mapping
- Integration: enumerate, version, reset, safe config, official flashing preflight
- E2E: fresh install -> detect -> info -> reset -> optional official flash -> capture/export
- Observability: structured logs and issue-ready failure bundles

## Hardware validation lane
Before claiming guarded flashing is release-ready, run the sacrificial-device procedure in:
- `packages/compat-lab/flash-validation-runbook.md`
- `packages/compat-lab/flash-validation-report-template.md`

Minimum evidence set:
- one recorded happy-path flash on sacrificial hardware
- pre-flash version/status evidence
- post-flash version/status evidence
- reconnect + full recovery timings
- recovery notes if the official tool reports reset trouble

## Release gate
No public milestone ships without hardware-backed smoke evidence.
