# Official read-only protocol research

## Primary-source findings
From the official Ubertooth source:
- `UBERTOOTH_GET_SERIAL = 14`
- `UBERTOOTH_GET_PARTNUM = 15`
- `UBERTOOTH_GET_REV_NUM = 33`
- `UBERTOOTH_GET_BOARD_ID = 35`
- `UBERTOOTH_GET_COMPILE_INFO = 55`

These command IDs come from `host/libubertooth/src/ubertooth_interface.h` in the official repo.

## Host-side behavior
The official host tools use vendor control reads (`CTRL_IN`) for these commands.
In upstream `ubertooth_control.c`, `CTRL_IN` is defined as:
- `LIBUSB_REQUEST_TYPE_VENDOR | LIBUSB_ENDPOINT_IN`

That corresponds to a control request type of `0xC0`.

## Response formats
### GET_REV_NUM (33)
Upstream host parsing:
- bytes 0..1 = old numeric revision field
- byte 2 = string length
- bytes 3.. = firmware revision string

On the connected device this returned:
- `2020-12-R1`

### GET_COMPILE_INFO (55)
Upstream firmware and host agree on:
- byte 0 = string length
- bytes 1.. = compile-info string

On the connected device this returned a build string beginning with:
- `ubertooth 2020-12-R1 ...`

### GET_BOARD_ID (35)
Returns a single byte board ID.
Upstream `ubertooth-util.c` maps:
- `0` -> Ubertooth Zero
- `1` -> Ubertooth One
- `2` -> ToorCon 13 Badge

### GET_SERIAL (14)
Returns 17 bytes:
- byte 0 = status (expected `0`)
- bytes 1..16 = MCU serial data

### GET_PARTNUM (15)
Returns 5 bytes:
- byte 0 = status (expected `0`)
- bytes 1..4 = little-endian part number

## API version
Upstream `ubertooth_get_api()` does **not** use a vendor command. It reads `bcdDevice` from the USB device descriptor and compares it against `UBERTOOTH_API_VERSION`.
On this device, `bcdDevice = 0x0107`, which matches upstream API version `0x0107`.

## Safety note
All commands above are implemented here as **control-IN only** reads. No firmware writes, no DFU, no mode changes.
