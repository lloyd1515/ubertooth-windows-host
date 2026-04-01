# Contributing

## Ground rules
- Keep device safety first.
- Do not introduce default flows that can brick devices.
- Prefer host-side work over firmware-side experimentation.
- Every milestone change must update docs + verification notes.

## Development flow
1. Pick a task from `tasks/`.
2. Link work to a milestone.
3. Add or update verification notes.
4. Record parity gaps instead of hand-waving them.

## Required evidence before merge
- What hardware or simulation path was used
- What command(s) were tested
- What safety guardrails were added or preserved
- What still does not work on Windows
