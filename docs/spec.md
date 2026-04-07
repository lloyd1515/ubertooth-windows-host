# Technical Specification: Ubertooth One Windows Host

## 1. Hardware Interface Specification
This project targets the **Ubertooth One** hardware (LPC175x + CC2400 + CC2591).

### 1.1 USB Endpoint Configuration
- **EP0 (Control)**: Used for all `control-IN` (diagnostics) and `control-OUT` (reset/flash) requests.
- **EP2 (Bulk IN)**: Streaming raw packets for capture commands.
- **EP5 (Bulk OUT)**: Raw symbol transmission (TX).

### 1.2 Hardware Safety Protocol (HSP)
As per industry safety standards for SDR [1], [12]:
- **Antenna Guard**: Mandatory `--i-confirm-antenna-is-attached` flag before any EP5/TX activity.
- **Thermal Management**: Rolling-hour duty-cycle limit of 60s monitored by `packages/cli/src/ubertoothExeRunner.js`.

## 2. Software Architecture (Spec-Driven)

### 2.1 Transport Layer (`core-usb`)
- **Engine**: WinUSB (Windows-native USB stack).
- **Semantics**:
  - `Discovery`: WMI/CIM-based enumeration of `USB\VID_1D50&PID_6002` (Runtime) and `PID_6003` (DFU).
  - `Access`: Exclusive access to the first matched WinUSB interface.

### 2.2 Protocol Layer (`core-protocol`)
- **Structure**: Host-to-Device (H2D) and Device-to-Host (D2H) packet definitions.
- **Safety**: Strict validation of `bcdDevice` and `bcdUSB` before flashing.

### 2.3 Signal Processing (`capture-export`)
- **Input**: Raw IQ stream or demodulated BLE packets from EP2.
- **Output**: 
  - `Live`: Node.js streams to `stdout`.
  - `File`: PCAP/PCAPNG delegation via `ubertooth-btle`.

## 3. Signal Validation Logic
- **Regression Tests**: `tests/signals/` includes static IQ bitstreams for parser verification.
- **Accuracy**: CRC validation is enforced by default in `btle` commands.

## 4. Regulatory Compliance
- **Frequency Range**: 2402 MHz - 2480 MHz (ISM Band).
- **Compliance**: Software locks prevent transmission outside the 2.4GHz band to maintain FCC Part 15 / ETSI compliance [11].

## Sources
- [1] LobeHub: Spec-Driven Development (2026)
- [7] ResearchGate: SDR Signal Validation Suites
- [12] RF Globalnet: Hardware Safety Protocols
