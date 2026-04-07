# Security Policy

## Supported Versions

Only the latest `main` branch is supported for security updates.

| Version | Supported |
| ------- | --------- |
| v0.2.x  | ✅         |
| v0.1.x  | ❌         |

## Hardware Vulnerability Disclosure
As this project interacts directly with the **Ubertooth One** hardware, we take RF safety and hardware security seriously.

1.  **Safety First**: If you discover a vulnerability that could cause **physical damage** to the hardware (e.g., thermal overload, RF front-end destruction), please report it IMMEDIATELY as described below.
2.  **Reporting**: Do not open a public GitHub issue. Send a detailed report via the official project communication channel (email/slack) as defined in the maintainer's profile.
3.  **Process**: We aim to acknowledge reports within 48 hours and provide a mitigation plan within 7 days.
4.  **Hardware Failures**: This policy covers software-induced hardware failures. For pure hardware defects, please consult the original hardware manufacturer.

## Software Security
For standard software vulnerabilities (buffer overflows, PowerShell injection, etc.):
- Please report via the GitHub "Report a vulnerability" button.
- We follow a 90-day disclosure timeline.

## Disclosure Sources
Our security practices are aligned with the **OpenSSF Best Practices** [3] and **NIST SP 800-121r2-upd1** for Bluetooth security.
