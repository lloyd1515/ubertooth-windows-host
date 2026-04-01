# Milestone 0 Implementation Notes

## Current implementation slice
A zero-dependency Node.js prototype now exists for:
- safe Windows read-only discovery and probe reporting
- safe read-only WinUSB open + standard USB descriptor query
- safe official read-only protocol queries for version/info metadata
- safe official read-only runtime getter queries

## What it currently does
- Detects devices matching Ubertooth VID/PID.
- Reports driver/class/provider metadata.
- Discovers Windows interface paths for the device.
- Opens the preferred interface through WinUSB in a read-only transport check.
- Retrieves standard USB descriptor info.
- Retrieves official read-only protocol info.
- Retrieves official read-only runtime state such as LEDs, channel, modulation, PA state, squelch, and clock.

## What it still does not do
- Send write/control-out commands.
- Change device runtime state.
- Flash firmware.
- Capture BLE traffic.

## Primary sources used
- Official host command IDs: `host/libubertooth/src/ubertooth_interface.h`
- Official host getter implementations: `host/libubertooth/src/ubertooth_control.c`
- Official firmware handlers: `firmware/bluetooth_rxtx/bluetooth_rxtx.c`
- Official util docs: `host/doc/ubertooth-util.md`
