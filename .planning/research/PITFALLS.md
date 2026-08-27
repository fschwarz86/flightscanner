# Research: Pitfalls & Gotchas

**Research Date:** 2026-08-27

## Common ADS-B & Flight Tracking Pitfalls

### 1. Unofficial Flightradar24 Rate Limiting & Blocking
- **Risk**: Aggressive queries to unofficial Flightradar24 endpoints can result in HTTP 429 or temporary IP throttling.
- **Mitigation**:
  - Rate limit requests with minimum delay between queries.
  - Implement caching of route lookups (same flight number / hex retains route data for hours).
  - Graceful, automatic fallback to adsbdb.com and CSV metadata on any HTTP error or timeout.

### 2. dump1090-fa File Write Concurrency (Partial Reads)
- **Risk**: dump1090 writes `/run/dump1090-fa/aircraft.json` atomically or in bursts, which can trigger chokidar before the write completes, resulting in `SyntaxError: Unexpected end of JSON input`.
- **Mitigation**: Wrap JSON parsing in safe try/catch, add a tiny debounce delay (e.g., 50-100ms) or retry on transient parse failure.

### 3. Hardcoded Paths in systemd Service Context
- **Risk**: Systemd services running under dedicated service accounts (`User=flightscanner`) might not have access to user home directories or current working directories.
- **Mitigation**: Explicit configuration path priority (`/etc/flightscanner/config.json`), relative and absolute path resolution, and default fallback values.

### 4. Multiple Aircraft in Airspace
- **Risk**: Checking only `filteredData[0]` causes any other aircraft flying within the box at the same time to be ignored permanently.
- **Mitigation**: Process each aircraft in `filteredData` against a cooldown set.

### 5. MQTT Broker Restarts & Disconnects
- **Risk**: Home Assistant or Mosquitto restarts can cause unhandled socket drops or crash the Node process if event handlers are missing.
- **Mitigation**: Handle `mqttClient.on('error')`, `offline`, and `reconnect` events cleanly.

---
*Research: Pitfalls audit 2026-08-27*
