# External Integrations

**Analysis Date:** 2026-08-27

## APIs & External Services

**Flight Information & Aircraft Database:**
- adsbdb.com API - Queries flight route, airline name, origin, destination, and aircraft registration metadata
  - Endpoint: `https://api.adsbdb.com/v0/aircraft/{registration}?callsign={callsign}` in [`flightscanner.js:113`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L113)
  - SDK/Client: `axios`
  - Auth: None (public REST endpoint)

**Display & Notification Target:**
- Awtrix Matrix Display - Renders live flight notifications and airline icons via MQTT
  - Topic: `awtrix/cmd/notify` in [`flightscanner.js:13`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L13)
  - Client: `mqtt`
  - Payload format: `{"icon": "<id>", "repeat": 3, "scroll": {"speed": 50}, "text": "<message>"}` in [`flightscanner.js:173`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L173)

## Data Storage

**Databases:**
- None

**File Storage:**
- Local filesystem only:
  - Source ADS-B data: `/run/dump1090-fa/aircraft.json` in [`flightscanner.js:7`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L7)
  - Aircraft reference mapping: `/etc/flightdata/aircraft_types.csv` in [`flightscanner.js:8`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L8)

**Caching:**
- In-memory global variable `lastFlight` ([`flightscanner.js:16`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L16)) to deduplicate consecutive notifications for the same flight.

## Authentication & Identity

**Auth Provider:**
- Custom MQTT basic authentication configured in [`flightscanner.js:37-38`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L37-L38)

## Monitoring & Observability

**Error Tracking:**
- None (standard `console.error` in [`flightscanner.js:96,102,107,118`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L96))

**Logs:**
- Standard output via `console.log` for connection status, parsed records, and notification messages.

## CI/CD & Deployment

**Hosting:**
- Local Linux host / Raspberry Pi (service daemon or manual process)

**CI Pipeline:**
- None detected

## Environment Configuration

**Required env vars:**
- None currently used (configuration is hardcoded in script variables)

**Secrets location:**
- Hardcoded in [`flightscanner.js:12`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L12)

## Webhooks & Callbacks

**Incoming:**
- File change events triggered by `chokidar` on `/run/dump1090-fa/aircraft.json` in [`flightscanner.js:49`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L49)
- Process lifecycle signals `exit` and `SIGINT` in [`flightscanner.js:21-30`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L21-L30)

**Outgoing:**
- MQTT publish commands to `awtrix/cmd/notify` in [`flightscanner.js:177`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L177)

---

*Integration audit: 2026-08-27*
