# Milestone 3 — Capture Path MVP

## Slice 1 — Raw live BLE inspector (done)
- [x] Implement one Windows-friendly raw live BLE inspector command
- [x] Model it after upstream `ubertooth-btle -f`
- [x] Keep the first mode to one narrower reliable slice
- [x] Document at least one reproducible inspection workflow
- [x] Make limitations explicit

## Slice 2 — Bounded file export (next)
- [ ] Add bounded file export for the now-stable live inspector path
- [ ] Validate representative BLE traffic export
- [ ] Record parity gaps vs Linux for the first export-capable workflow

## Exit criteria
- [x] User can produce inspectable live capture output on Windows
- [ ] User can produce inspectable exported capture output on Windows
- [x] Limitations are explicit
