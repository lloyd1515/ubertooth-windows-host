# Test Strategy

Mirror the OMX test spec with repo-facing language.

## Must-have coverage
- Unit: protocol serialization, CLI validation, error mapping
- Integration: enumerate, version, reset, safe config, official flashing preflight
- E2E: fresh install -> detect -> info -> reset -> optional official flash -> capture/export
- Observability: structured logs and issue-ready failure bundles

## Release gate
No public milestone ships without hardware-backed smoke evidence.
