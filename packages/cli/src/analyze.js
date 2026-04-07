import readline from 'node:readline';
import { parsePacketLine } from '../../core-protocol/src/parsers/packetParser.js';

/**
 * Summarizes a stream of BLE packet logs.
 * Optimized for low memory and high speed.
 * @param {ReadableStream} stream 
 * @returns {Promise<Object>}
 */
export async function summarizePackets(stream) {
  const rl = readline.createInterface({
    input: stream,
    terminal: false,
    historySize: 0 // Disable history for performance
  });

  const summary = {
    packetCount: 0,
    uniqueLaps: new Set(),
    channels: new Uint32Array(80), // Fixed size array for channels 0-79
    totalSnr: 0,
    avgSnr: 0
  };

  for await (const line of rl) {
    const packet = parsePacketLine(line);
    if (!packet) continue;

    summary.packetCount++;
    if (packet.LAP && packet.LAP !== 'UNKNOWN') {
      summary.uniqueLaps.add(packet.LAP);
    }
    
    if (packet.ch != null && packet.ch >= 0 && packet.ch < 80) {
      summary.channels[packet.ch]++;
    }
    
    if (packet.s != null) {
      summary.totalSnr += packet.s;
    }
  }

  if (summary.packetCount > 0) {
    summary.avgSnr = summary.totalSnr / summary.packetCount;
  }

  return summary;
}
