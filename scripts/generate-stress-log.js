import { writeFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Generates a large BLE log file for stress testing.
 * @param {string} filePath 
 * @param {number} lineCount 
 */
export function generateStressLog(filePath, lineCount = 1000000) {
  console.log(`Generating ${lineCount} lines of mock BLE data in ${filePath}...`);
  const lines = [];
  const laps = ['aabbcc', 'ddeeff', '112233', '445566', '778899'];
  
  // Use a buffer or stream for very large files, but 1M lines ~ 50-100MB is okay for a simple loop with join
  // Actually, let's use a loop with chunks to avoid memory issues during generation
  const chunkSize = 10000;
  for (let i = 0; i < lineCount; i += chunkSize) {
    const chunk = [];
    for (let j = 0; j < chunkSize && (i + j) < lineCount; j++) {
      const lap = laps[Math.floor(Math.random() * laps.length)];
      const ch = Math.floor(Math.random() * 79);
      const rssi = -Math.floor(Math.random() * 40 + 50);
      const snr = rssi + 10;
      chunk.push(`systime=${i + j} ch=${ch} LAP=${lap} rssi=${rssi} s=${snr}\n`);
    }
    writeFileSync(filePath, chunk.join(''), { flag: 'a' });
  }
  console.log('Generation complete.');
}

const stressFile = path.resolve('stress_test_log.txt');
generateStressLog(stressFile, 1000000);
