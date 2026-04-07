# Roadmap

## Phase 1 — Windows-safe host parity (COMPLETE ✅)
- Milestone 0: feasibility spike
- Milestone 1: safe device control MVP
- Milestone 2: official flashing support
- Milestone 3: capture path MVP
- Milestone 4: public hardening

## Phase 2 — fuller parity (IN PROGRESS 🛠️)
- Sniffing robustness improvements (Auto-retry, BUSY guards) ✅
- PCAP export via extension inference ✅
- Broader command parity (specan, rx, dump, afh, util) ✅
- Native Windows BLE scanning/following (no BlueZ) ✅
- Performance and timing hardening (PowerShell optimization, adaptive polling) ✅
- Public hardening and documentation polish (README, parity docs) 🛠️

## Phase 3 — advanced stability & features (PLANNED 📋)
- Automated recovery path implementation (WinUSB driver repair)
- Advanced BLE analysis tools integration
- Performance stress testing and tuning

## Success definition
Phase 2 succeeds when the Windows CLI provides near-full feature parity with the official Linux tools for passive operations, with high reliability and clear diagnostic reporting.

