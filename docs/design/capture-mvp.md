# Design Document: Capture MVP for Ubertooth Windows Host

## Status
Revision 1 - Addressing Review Blockers (2026-04-02)

## Context
We have successfully ported and built the official Ubertooth host tools (`ubertooth-btle.exe`, etc.) natively on Windows. These tools reside in `official-ubertooth-src/host/build-windows/ubertooth-tools/src`.

The goal is to expose a safe, guarded `capture` command in our Node.js CLI that makes it easy for a user to start a BLE sniff and get a PCAP file without manually managing DLLs or complex CLI arguments.

## Personas & Use Cases

### Primary Persona: Security Student / Researcher
A user who wants to analyze BLE traffic on Windows without setting up a Linux VM or complex build environments.

### Use Cases (WHO/WANTS/SO THAT/WHEN)
1. **Researcher/Sniff Advertisements**: WHO: Researcher WANTS: to capture BLE advertisements on a specific channel SO THAT: they can identify local devices WHEN: starting a new reconnaissance session.
2. **Student/Follow Connection**: WHO: Student WANTS: to follow a specific MAC address SO THAT: they can capture the full connection handshake WHEN: debugging a specific BLE peripheral.

## Success Metrics
- **Ease of Use**: Users can start a capture with a single command in < 5 seconds.
- **Reliability**: 100% of captures initiated via CLI successfully produce a valid PCAP file readable by Wireshark.
- **Clean Cleanup**: 0 orphan `ubertooth-btle.exe` processes left after CLI exit.

## Objectives
- Safe execution of `ubertooth-btle.exe` from the Node.js host.
- Automatic detection of the tool location.
- Strict input validation for all capture parameters.
- Comprehensive TDD coverage for the wrapper logic.

## Architecture

### 1. Tool Management (`core-usb`)
- **Module**: `packages/core-usb/src/toolResolver.js`
- **Responsibility**: Locates built official tools, verifies DLLs, and prepares the environment.
- **Interface**:
  ```typescript
  async function resolveToolPath(toolName: string): Promise<string>;
  function getEnvironmentWithDlls(): NodeJS.ProcessEnv;
  ```

### 2. Capture Execution (`capture-export`)
- **Module**: `packages/capture-export/src/captureDevice.js`
- **Responsibility**: Wraps `child_process.spawn`, maps CLI flags, and handles the process lifecycle.
- **Interface**:
  ```typescript
  class CaptureSession extends EventEmitter {
    constructor(options: CaptureOptions);
    start(): Promise<void>;
    stop(): void;
    // Events: 'status' (packet counts), 'error', 'exit'
  }
  ```

### 3. CLI Integration (`cli`)
- New command: `npm run capture -- --file <path> --channel <37-39>`
- Arguments are validated using a strict schema before being passed to `CaptureSession`.

## Security & Safety

### Input Validation
All CLI arguments are validated using strict rules:
- `--channel`: Integer, restricted to 37, 38, or 39 for advertising mode.
- `--target`: Validated against a MAC address Regex (e.g., `^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$`).
- `--file`: Path sanitization to prevent directory traversal; must be in a writable, non-system directory.

### Process Management
- Use the `signal-exit` or `process.on('exit')` pattern to ensure `ubertooth-btle.exe` is terminated if the Node process dies.
- Capture sessions are limited to one concurrent instance per device serial to prevent hardware contention.

## Testing Strategy (TDD)
- **Unit Tests**: 100% coverage for `toolResolver` and `captureDevice`.
- **Mocking**: `child_process.spawn` and `node:fs` will be mocked to verify argument mapping and path resolution without requiring hardware.
- **Integration Tests**: Verify the full CLI-to-spawn flow using a mock "ubertooth-btle" script.

## Implementation Phases
1. **Scaffold `capture-export` package** with `package.json`.
2. **Implement `toolResolver`** in `core-usb` with tests.
3. **Implement `captureDevice`** in `capture-export` with tests.
4. **Add `capture` command to CLI** and update `render.js`.
