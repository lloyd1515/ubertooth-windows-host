# ADR 0001 — Host-first Windows repo strategy

## Decision
Start with a new Windows-focused host repository and stage delivery into safe host parity first, fuller parity second.

## Why
- Matches public-project requirement.
- Preserves device safety.
- Avoids firmware-first brick risk.
- Creates room for packaging, CI, and docs that a thin wrapper would not satisfy.

## Consequences
- Higher upfront cost.
- Longer road to full parity.
- Requires disciplined milestone gating.
