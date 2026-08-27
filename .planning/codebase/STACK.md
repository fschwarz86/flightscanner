# Technology Stack

**Analysis Date:** 2026-08-27

## Languages

**Primary:**
- JavaScript (CommonJS / Node.js) - Entire codebase in [`flightscanner.js`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js)

**Secondary:**
- None detected

## Runtime

**Environment:**
- Node.js (v14+ recommended for `fs.promises`, async/await, and ES2020 template literals)

**Package Manager:**
- npm (standalone script; `package.json` currently missing)
- Lockfile: missing

## Frameworks

**Core:**
- None (vanilla Node.js event-driven script)

**Testing:**
- None detected (no testing framework installed or configured)

**Build/Dev:**
- None (direct Node.js execution)

## Key Dependencies

**Critical:**
- `chokidar` - File system watcher for monitoring dump1090-fa aircraft data file updates in [`flightscanner.js:4`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L4)
- `mqtt` - Client library for connecting and publishing notifications to Home Assistant / Awtrix MQTT broker in [`flightscanner.js:3`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L3)
- `axios` - HTTP client for querying the external adsbdb.com aircraft and flight route API in [`flightscanner.js:2`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L2)
- `papaparse` - CSV parsing library for streaming and loading the ICAO aircraft type reference data in [`flightscanner.js:5`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L5)

**Infrastructure:**
- `dump1090-fa` - External ADS-B receiver service producing aircraft telemetry at `/run/dump1090-fa/aircraft.json`
- `Home Assistant / Mosquitto` - MQTT broker on host `homeassistant:1883`
- `Awtrix` - Pixel clock matrix display listening on MQTT topic `awtrix/cmd/notify`

## Configuration

**Environment:**
- Hardcoded constants in [`flightscanner.js`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js):
  - Aircraft file path: `/run/dump1090-fa/aircraft.json` ([`flightscanner.js:7`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L7))
  - Aircraft types CSV path: `/etc/flightdata/aircraft_types.csv` ([`flightscanner.js:8`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L8))
  - MQTT broker host/port: `homeassistant:1883` ([`flightscanner.js:9-10`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L9-L10))
  - MQTT credentials: hardcoded in source ([`flightscanner.js:11-12`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L11-L12))
  - MQTT topic: `awtrix/cmd/notify` ([`flightscanner.js:13`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L13))

**Build:**
- No build step required

## Platform Requirements

**Development:**
- Node.js runtime
- Access to local dump1090 socket/JSON file or mocked test files

**Production:**
- Linux host running dump1090-fa (e.g., Raspberry Pi ADS-B receiver)
- Local network access to Home Assistant MQTT broker
- Accessible `/etc/flightdata/aircraft_types.csv` file

---

*Stack analysis: 2026-08-27*
