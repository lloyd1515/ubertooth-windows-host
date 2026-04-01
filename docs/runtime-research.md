# Official read-only runtime research

## Candidate getter commands selected from upstream
From the official Ubertooth host and firmware sources, the next safe getter-only runtime set is:
- `UBERTOOTH_GET_USRLED = 3`
- `UBERTOOTH_GET_RXLED = 5`
- `UBERTOOTH_GET_TXLED = 7`
- `UBERTOOTH_GET_1V8 = 9`
- `UBERTOOTH_GET_CHANNEL = 11`
- `UBERTOOTH_GET_PAEN = 16`
- `UBERTOOTH_GET_HGM = 18`
- `UBERTOOTH_GET_MOD = 22`
- `UBERTOOTH_GET_PALEVEL = 28`
- `UBERTOOTH_GET_SQUELCH = 37`
- `UBERTOOTH_GET_CLOCK = 41`

## Why these are in-bounds
In upstream `bluetooth_rxtx.c`, these handlers only populate response data and set `*data_len`. They do not write firmware or switch the device into DFU/flash modes.

## Parsing notes
- LED / 1V8 / PAEN / HGM getters return a single boolean-like byte.
- `GET_CHANNEL` returns a little-endian 16-bit MHz frequency.
- `GET_MOD` returns an enum value from `modulations` in `ubertooth_interface.h`.
- `GET_PALEVEL` returns the low 3 bits of the CC2400 `FREND` register in the current firmware.
- `GET_SQUELCH` returns `cs_threshold_req`, effectively an 8-bit signed value exposed over USB.
- `GET_CLOCK` returns a little-endian 32-bit `clkn` value.

## Safety boundary
These runtime getters are still implemented here as **control-IN only** requests. No control-out paths were added.
