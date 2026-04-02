# Design Document: Capture MVP for Ubertooth Windows Host

## Status
Drafting - Brainstorming Phase

## Context
We have successfully ported and built the official Ubertooth host tools (`ubertooth-btle.exe`, etc.) natively on Windows using MSYS2/MinGW. These tools currently reside in `official-ubertooth-src/host/build-windows/ubertooth-tools/src`.

The goal is to expose a safe, guarded `capture` command in our Node.js CLI that makes it easy for a user to start a BLE sniff and get a PCAP file without manually managing DLLs or complex CLI arguments.

## Objectives
- Safe execution of `ubertooth-btle.exe` from the Node.js host.
- Automatic detection of the tool location or clear configuration.
- Support for capturing to a PCAP file.
- Real-time status reporting in the console.

## Architecture

### 1. Tool Management (`core-usb`)
A new module `packages/core-usb/src/toolResolver.js` will:
- Locate the built official tools.
- Verify DLL presence.
- Prepare the environment (injecting MSYS2 paths if necessary).

### 2. Capture Execution (`core-usb`)
A new module `packages/packages/core-usb/src/captureDevice.js` will:
- Wrap `child_process.spawn`.
- Map CLI flags (e.g., channel, target MAC) to `ubertooth-btle` arguments.
- Handle process termination and cleanup.

### 3. CLI Integration (`cli`)
- New command: `npm run capture -- --file my_capture.pcap --channel 37`
- New command: `npm run sniff` (alias for follow mode).

## User Experience
```bash
# Start capturing advertisements on channel 38 to a file
npm run capture -- --file capture.pcap --channel 38

# Start following a specific device
npm run capture -- --follow --target AA:BB:CC:DD:EE:FF
```

## Risks & Constraints
- **DLL Dependencies:** The tools require `libusb-1.0.dll`, `libbtbb.dll`, and `libubertooth.dll`.
- **Permissions:** Wireshark might need specific permissions to read the PCAP file if it's being written to in real-time.
- **Process Orphans:** If the Node process crashes, we must ensure `ubertooth-btle.exe` is killed.

## Implementation Phases
1. **Scaffold `capture-export` package.**
2. **Implement `toolResolver`.**
3. **Implement `captureDevice` wrapper.**
4. **Add CLI command and basic rendering.**
