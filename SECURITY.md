# Security Policy

## Supported Versions

Only the latest `main` branch is supported for security updates.

| Version | Supported |
| ------- | --------- |
| v0.2.x  | ✅         |
| v0.1.x  | ❌         |

## Regulatory & NIST Compliance
This project aligns with **NIST SP 800-121r2 (Guide to Bluetooth Security)** [2] for robust host-side interaction:
-   **Visibility**: We recommend keeping Ubertooth-monitored devices in "Non-discoverable" mode unless an active scan is required.
-   **Pairing Mode**: This host scaffold prioritizes modes that avoid "Just Works" pairing for sensitive data, favoring **Numeric Comparison** or **Passkey Entry** to mitigate MITM risks.
-   **Legacy Deprecation**: We discourage use with Bluetooth 2.0 or earlier due to weak E0/E1 encryption.

## Hardware Vulnerability Disclosure
...
## Sources
- [2] NIST SP 800-121r2 - Guide to Bluetooth Security (Revision 2, Jan 2022)
- [3] OpenSSF Best Practices (Scorecard v5) - SHA-Pinning and Scoped Tokens
