# ADR 0002 — Provisional USB stack direction

## Decision
Bias Milestone 0 toward a **WinUSB-first** host transport, while keeping the internal transport boundary abstract enough to support a future libusb-based adapter if needed.

## Drivers
- Public Windows support should lean on Microsoft-supported paths where possible.
- Custom kernel-driver work is outside the current safety posture.
- The project still needs an escape hatch if upstream interoperability is easier through libusb semantics.

## Alternatives considered
- **libusb-first:** good compatibility story, but still depends on driver-install realities and adds an extra abstraction layer on Windows.
- **HID-first:** only valid if device evidence proves HID is the correct transport, which we have not established.

## Consequences
- Early implementation may be more Windows-specific.
- Driver-install and packaging UX become first-class concerns.
- Transport abstraction must be designed early to avoid lock-in.

## Follow-ups
- Verify device binding story on a real Windows setup.
- Add a compatibility note mapping transport assumptions to upstream behavior.
- Revisit this ADR after the first successful enumeration prototype.
