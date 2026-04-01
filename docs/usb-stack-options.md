# USB Stack Options

## Context
Milestone 0 needs a Windows USB direction that keeps device-risk low and gives the project a credible public support story.

## Primary-source facts
- Microsoft says WinUSB is a strong fit when a device can use a Microsoft-provided driver and is accessed by a single application.
- libusb on Windows supports WinUSB/HID/libusbK/libusb-win32-backed access, but typically requires a supported driver to be installed.
- `nusb` on Windows uses WinUSB.

## Options
### Option A — Direct WinUSB-backed transport
Pros:
- Closest to Microsoft-supported Windows path.
- Strong safety/public-support story.
- Avoids a custom kernel driver.
Cons:
- More Windows-specific code.
- Cross-platform reuse is weaker.

### Option B — libusb-backed transport on Windows
Pros:
- Cross-platform API surface.
- Reuse-friendly if upstream semantics already align with libusb-style comms.
Cons:
- Driver installation story still matters.
- Adds another compatibility layer on top of Windows driver reality.

### Option C — HID-centric path
Pros:
- Easy if the device is already a true HID target.
Cons:
- Likely wrong abstraction for a non-HID-oriented Ubertooth host stack.
- Should only be used if device evidence proves it is the right transport.

## Provisional recommendation
Use a **WinUSB-first transport strategy** with a transport abstraction that keeps a **libusb-backed adapter** possible later if it materially helps upstream command compatibility.

## Why this recommendation
- Best fit for a serious Windows public project.
- Lowest need for custom driver work.
- Keeps the repo host-first and safety-oriented.
- Leaves room for future cross-platform reuse without forcing it on day 1.

## Next validation tasks
- Confirm the device can be bound and accessed cleanly through WinUSB on the intended Windows baseline.
- Confirm required endpoint patterns and timeout behavior.
- Document the driver-install story users would actually follow.
