/**
 * Utility for parsing Ubertooth BLE key-value log output.
 */

export const NUMERIC_FIELDS = ['systime', 'ch', 'err', 'clkn', 'clk_offset', 's', 'n', 'snr'];
const NUMERIC_SET = new Set(NUMERIC_FIELDS);

/**
 * Parses a single line of key-value pairs (e.g. "systime=123 ch=37 LAP=aabbcc")
 * Highly optimized for high-volume streams.
 * @param {string} line 
 * @returns {Object|null}
 */
export function parsePacketLine(line) {
  if (!line || typeof line !== 'string') return null;

  const packet = {};
  let hasData = false;
  
  // Faster than regex matchAll for simple key=value pairs
  const pairs = line.split(' ');
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    if (!pair) continue;
    
    const eqIndex = pair.indexOf('=');
    if (eqIndex === -1) continue;
    
    const key = pair.substring(0, eqIndex);
    const value = pair.substring(eqIndex + 1);
    
    hasData = true;
    if (NUMERIC_SET.has(key)) {
      const num = Number(value);
      packet[key] = isNaN(num) ? value : num;
    } else {
      packet[key] = value;
    }
  }

  if (!hasData) return null;

  if (!packet.LAP) {
    packet.LAP = 'UNKNOWN';
  }

  return packet;
}

/**
 * Log-Distance Path Loss Model for distance estimation.
 * @param {number} rssi 
 * @param {number} txPowerAtOneMeter (default -59)
 * @param {number} pathLossExponent (default 2.0 for free space)
 * @returns {number} Estimated distance in meters
 */
export function estimateDistance(rssi, txPowerAtOneMeter = -59, pathLossExponent = 2.0) {
  if (rssi == null || isNaN(rssi)) return null;
  return Math.pow(10, (txPowerAtOneMeter - rssi) / (10 * pathLossExponent));
}
