# Contributing to Ubertooth Windows Host

Thank you for your interest in improving the Windows-first experience for Ubertooth One.

## Governance
This project follows a **SDR-First Sustainablity** model [4].

### Contributor to Maintainer Path
1.  **Triage**: Help identify and tag issues.
2.  **Developer**: Submit 3+ verified PRs that pass the hardware smoke test matrix.
3.  **Maintainer**: Invited by existing maintainers based on consistent high-fidelity contributions and hardware safety awareness.

## Hardware Requirements
Contributors MUST have physical access to:
- **Ubertooth One** (latest firmware recommended).
- **Antenna** (Mandatory for TX tests).
- **Windows 10/11 Host**.

## Development Workflow
1.  **Fork and Branch**: Always work on a feature branch.
2.  **Safety First**: Never submit code that bypasses the `checkHardwareSafety` duty-cycle or antenna guards.
3.  **TDD**: New features MUST include `node:test` coverage.
4.  **Sign Your Commits**: We enforce "Vigilant Mode" [2]. Commits must be GPG or SSH signed.

## Standards Alignment
All contributions should align with the project's **Spec-Driven Development (SDD)** model found in `docs/spec.md`.

## Sources
- [4] GitHub Blog: Maintainer Pathways (2026 Edition)
- [2] Vigilant Mode & Signed Commits (Industry Standard)
