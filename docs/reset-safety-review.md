# Reset Safety Review

## Scope
Review whether exposing a Windows-host `reset` command is still inside an acceptable safety envelope for this repository.

## Decision
**Conditional go / yellow-light**.

A standalone reset command appears materially safer than DFU, ISP, flashing, or other write-capable flows, but it is **not zero-risk** and it does intentionally change device state. It should only be added with explicit guardrails and with messaging that makes the expected disconnect/reconnect behavior obvious.

## Primary-source evidence

### 1. Official host tool treats reset as a vendor control-out request
In upstream `host/libubertooth/src/ubertooth_control.c`, `cmd_reset()` sends `UBERTOOTH_RESET` over `CTRL_OUT` and explicitly treats `LIBUSB_ERROR_PIPE`, `LIBUSB_ERROR_OTHER`, and `LIBUSB_ERROR_NO_DEVICE` as expected outcomes.

Why that matters:
- the host already expects USB disruption during reset
- a successful UX must treat temporary transport errors as a normal side effect of reboot

### 2. Official firmware handler maps reset to `MODE_RESET`
In upstream `firmware/bluetooth_rxtx/bluetooth_rxtx.c`, the `UBERTOOTH_RESET` request does:
- `requested_mode = MODE_RESET`

This suggests the command is not itself writing firmware or entering DFU. It requests a runtime-mode transition.

### 3. The firmware waits for the USB command to return, then reboots
In the firmware mode-dispatch path, `MODE_RESET` does:
- `wait(1);`
- `reset();`

There is even an inline comment saying the wait exists to allow the USB command to return correctly before the reset happens.

### 4. `reset()` is a watchdog-driven reboot path
In upstream `firmware/common/ubertooth.c`, `reset()`:
- calls `all_pins_off()`
- clears the user LED
- enables the watchdog with reset enabled
- feeds the watchdog
- waits

This looks like a firmware reboot path, not a flash/erase path.

### 5. DFU is explicitly a separate path
Also in the firmware request handler, `UBERTOOTH_FLASH` sets:
- `bootloader_ctrl = DFU_MODE`
- `requested_mode = MODE_RESET`

That distinction matters a lot:
- **plain reset** = reboot path
- **flash/DFU** = set bootloader control first, then reset

So based on the official source, reset by itself does **not** imply DFU.

## Risk assessment

### Device-brick risk
**Low** relative to flashing/DFU/ISP.

I did not find evidence in the official source that plain `UBERTOOTH_RESET` writes firmware, erases flash, or enters DFU on its own.

### Operational risk
**Moderate**.

Reset can still:
- drop the USB session mid-command
- make Windows briefly lose the device and re-enumerate it
- interrupt capture/streaming state
- create confusing UX if the CLI reports a transport error even though the reset actually succeeded

### Public-support risk
**Moderate**.

If implemented naively, users may interpret expected disconnect/reconnect behavior as failure or damage.

## Recommendation
Expose reset only if all of the following are true:

1. **Explicit command boundary**
   - `reset` should be its own command, not folded into status or auto-recovery.

2. **Documentation says what will happen**
   - device will likely disconnect and reconnect
   - transient transport errors can be expected
   - this is not DFU or flashing

3. **Guardrails before running**
   - only run when the device has already passed `detect` / `probe`
   - block if no device is present
   - block from any future long-running capture mode unless stopped first

4. **Success criteria are reconnect-based, not transfer-based**
   - do not judge success only by the control-transfer return code
   - treat reset as successful if the device reappears and probe/status recovers within a bounded timeout

5. **No chaining with write paths**
   - do not silently combine reset with DFU or flashing behavior

## Suggested implementation posture
If implemented later, the safest UX would be something like:
- send official reset request
- tolerate the expected disconnect/error classes
- poll for device re-enumeration for a short bounded window
- report one of:
  - `reset completed and device reappeared`
  - `reset may have been sent, but the device did not reappear in time`

## Recommendation status
- **Okay to implement later with guardrails:** yes
- **Okay to auto-run:** no
- **Okay to treat like a pure read-only command:** no
- **Anywhere near as risky as flashing/DFU/ISP:** no

## Source pointers
- `host/libubertooth/src/ubertooth_control.c`
- `firmware/bluetooth_rxtx/bluetooth_rxtx.c`
- `firmware/common/ubertooth.c`
- `host/doc/ubertooth-util.md`
