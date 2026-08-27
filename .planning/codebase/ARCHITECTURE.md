<!-- refreshed: 2026-08-27 -->
# Architecture

**Analysis Date:** 2026-08-27

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                 Dump1090-FA (ADS-B Receiver)                │
│                 `/run/dump1090-fa/aircraft.json`            │
└──────────────────────────────┬──────────────────────────────┘
                               │ (File watch / chokidar)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Flight Scanner (`flightscanner.js`)             │
│  - Spatial & Altitude Filter (lat/lon bounding box, alt)    │
│  - Duplicate Flight Detector (`lastFlight`)                 │
└──────────────┬──────────────────────────────┬───────────────┘
               │ (HTTP REST)                  │ (CSV Lookup)
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│   adsbdb.com Public API      │ │ `/etc/flightdata/`         │
│   (Route, Airline, Origin)   │ │ `aircraft_types.csv`       │
└──────────────┬───────────────┘ └────────────┬───────────────┘
               │                              │
               └──────────────┬───────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              MQTT Notification Formatter                    │
│              (`notifyDisplay` in `flightscanner.js`)        │
└─────────────────────────────┬───────────────────────────────┘
                              │ (MQTT Publish)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│          Home Assistant / Awtrix Display                    │
│          Topic: `awtrix/cmd/notify`                         │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `watcher` | Listens for file changes on dump1090 output | [`flightscanner.js:18-50`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L18-L50) |
| `watchFile` | Reads JSON, filters aircraft within bounding box and altitude | [`flightscanner.js:47-109`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L47-L109) |
| `fetchFlightData` | Retrieves enriched route and aircraft details from adsbdb.com API | [`flightscanner.js:111-121`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L111-L121) |
| `Papa.parse` | Reads and indexes ICAO aircraft types on startup | [`flightscanner.js:123-134`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L123-L134) |
| `notifyDisplay` | Formats German notification text, selects airline icon, publishes MQTT message | [`flightscanner.js:138-178`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L138-L178) |

## Pattern Overview

**Overall:** Event-Driven File Watcher and Data Enrichment Pipeline

**Key Characteristics:**
- Reactive file change trigger via `chokidar`
- Geofenced filtering of aircraft telemetry (lat 53.65-53.72, lon 10.10-10.20, alt 2000-10000 ft)
- External REST enrichment with local CSV mapping fallback
- Push-based MQTT publishing to an external matrix display

## Layers

**Ingestion & Watcher Layer:**
- Purpose: Detect changes in ADS-B receiver dump file and parse JSON payload
- Location: [`flightscanner.js:47-64`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L47-L64)
- Contains: `chokidar` handler, `fs.promises.readFile`, `JSON.parse`
- Depends on: Local filesystem (`/run/dump1090-fa/aircraft.json`)
- Used by: Processing pipeline

**Filtering & Business Logic Layer:**
- Purpose: Apply coordinate bounding box and altitude limits; filter out duplicate consecutive sightings
- Location: [`flightscanner.js:59-74`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L59-L74)
- Contains: Array filter predicates, state comparison against `lastFlight`
- Depends on: Raw JSON aircraft array
- Used by: Enrichment step

**Enrichment Layer:**
- Purpose: Query external adsbdb.com API and match ICAO type against local CSV data
- Location: [`flightscanner.js:76-87, 111-121, 123-134`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L76-L87)
- Contains: HTTP REST call, CSV array lookup
- Depends on: `axios`, `papaparse`, network access to `api.adsbdb.com`
- Used by: Notification layer

**Notification & Output Layer:**
- Purpose: Build UI payload with icon ID and localized text, publish via MQTT
- Location: [`flightscanner.js:138-178`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L138-L178)
- Contains: Icon lookup table, text generation logic, `mqttClient.publish`
- Depends on: `mqtt` client connection
- Used by: Ingestion layer on successful flight detection

## Data Flow

### Primary Request Path

1. ADS-B receiver writes `/run/dump1090-fa/aircraft.json`
2. `watcher.on('change')` triggers asynchronous handler ([`flightscanner.js:49`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L49))
3. File read and parsed to JSON; aircraft filtered by lat, lon, and altitude ([`flightscanner.js:54-62`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L54-L62))
4. First matching flight callsign compared with `lastFlight` ([`flightscanner.js:68`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L68))
5. `fetchFlightData(registration, callsign)` requests route metadata ([`flightscanner.js:76`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L76))
6. Aircraft type matched in `aircraftTypes` array ([`flightscanner.js:84-86`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L84-L86))
7. `notifyDisplay(...)` formats payload and publishes to `awtrix/cmd/notify` via MQTT ([`flightscanner.js:89, 177`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L89))

**State Management:**
- Module-level variable `lastFlight` holds the most recently notified flight callsign string to avoid duplicate spam.
- In-memory array `aircraftTypes` holds preloaded CSV rows for ICAO lookups.

## Key Abstractions

**Flight Notification Message:**
- Purpose: Structured payload formatted for Awtrix matrix screen display
- Examples: [`flightscanner.js:173`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L173)
- Pattern: Object literal with icon ID, repeat count, scroll speed, and display text

## Entry Points

**Main Script Execution:**
- Location: [`flightscanner.js`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js)
- Triggers: Node.js process startup (`node flightscanner.js`)
- Responsibilities: Initializes MQTT client, loads aircraft types CSV stream, registers process exit signals, and starts file watching

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop
- **Global state:** Mutable top-level variables `lastFlight` and `aircraftTypes` in [`flightscanner.js:16, 125`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L16)
- **Circular imports:** None (single-file architecture)
- **Error handling:** Partial try/catch blocks in async callbacks; network or file errors log to console and fall back to default notifications

---

*Architecture analysis: 2026-08-27*
