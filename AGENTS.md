<!-- GSD:project-start source:PROJECT.md -->

## Project

**Flightscanner**

A real-time ADS-B flight tracking and notification service for local airspace monitoring. It observes local receiver telemetry from dump1090-fa, enriches flight data with airline and route details via Flightradar24 and adsbdb.com, and sends formatted visual alerts to an Awtrix LED matrix display via MQTT. Designed for robust, headless 24/7 operation as a Linux systemd service.

**Core Value:** Reliably capture local overhead flights and deliver rich, accurate flight route notifications to the Awtrix display with zero unhandled crashes or dropped flight events.

### Constraints

- **Runtime**: Node.js (v18+)
- **Systemd compatibility**: Config must resolve from `/etc/flightscanner/` or environment variables without manual code edits
- **Performance**: Lightweight memory and CPU footprint suitable for single-board computers

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- JavaScript (CommonJS / Node.js) - Entire codebase in [`flightscanner.js`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js)
- None detected

## Runtime

- Node.js (v14+ recommended for `fs.promises`, async/await, and ES2020 template literals)
- npm (standalone script; `package.json` currently missing)
- Lockfile: missing

## Frameworks

- None (vanilla Node.js event-driven script)
- None detected (no testing framework installed or configured)
- None (direct Node.js execution)

## Key Dependencies

- `chokidar` - File system watcher for monitoring dump1090-fa aircraft data file updates in [`flightscanner.js:4`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L4)
- `mqtt` - Client library for connecting and publishing notifications to Home Assistant / Awtrix MQTT broker in [`flightscanner.js:3`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L3)
- `axios` - HTTP client for querying the external adsbdb.com aircraft and flight route API in [`flightscanner.js:2`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L2)
- `papaparse` - CSV parsing library for streaming and loading the ICAO aircraft type reference data in [`flightscanner.js:5`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L5)
- `dump1090-fa` - External ADS-B receiver service producing aircraft telemetry at `/run/dump1090-fa/aircraft.json`
- `Home Assistant / Mosquitto` - MQTT broker on host `homeassistant:1883`
- `Awtrix` - Pixel clock matrix display listening on MQTT topic `awtrix/cmd/notify`

## Configuration

- Hardcoded constants in [`flightscanner.js`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js):
- No build step required

## Platform Requirements

- Node.js runtime
- Access to local dump1090 socket/JSON file or mocked test files
- Linux host running dump1090-fa (e.g., Raspberry Pi ADS-B receiver)
- Local network access to Home Assistant MQTT broker
- Accessible `/etc/flightdata/aircraft_types.csv` file

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- Flat lowercase: `flightscanner.js`
- camelCase: `watchFile()`, `fetchFlightData()`, `notifyDisplay()` in [`flightscanner.js:47,111,138`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L47)
- Mixed camelCase and PascalCase for file streams:
- Plain JavaScript objects: `{ "icon": '' + icon, "repeat": 3, "scroll": { "speed": 50 }, "text": text }` in [`flightscanner.js:173`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L173)

## Code Style

- 2-4 spaces indentation
- Semicolons used inconsistently
- Standard JavaScript CommonJS module format (`require(...)`)
- No linter (ESLint / Biome) configured in project

## Import Organization

- None (standard CommonJS relative / package requires)

## Error Handling

- `try/catch` blocks around asynchronous operations in [`flightscanner.js:48, 52, 75, 101, 106, 112, 117`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L48)
- Fallback values assigned on API failure in catch block:

## Logging

- Native `console.log` and `console.error`
- `console.log('MQTT Connected')` on broker connection
- `console.error('Error fetching data:', error.response.status)` on HTTP errors
- Formatted notification strings logged to standard output before sending MQTT message

## Comments

- Minimal inline comments indicating process lifecycle hooks (`//do something when app is closing`, `//catches ctrl+c event`)
- Commented-out debugging statements (`// console.log(...)`)
- Not used

## Function Design

- Small to medium functions (15-60 lines)
- Explicit positional arguments: `fetchFlightData(registration, callsign)` and `notifyDisplay(airline, callsign, origin, destination, aircraft)`
- Async functions return payload data (`fetchFlightData` returns `flightData`) or void (`watchFile`, `notifyDisplay`)

## Module Design

- Single monolithic script without module exports
- Not used

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Overview

```text

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

- Reactive file change trigger via `chokidar`
- Geofenced filtering of aircraft telemetry (lat 53.65-53.72, lon 10.10-10.20, alt 2000-10000 ft)
- External REST enrichment with local CSV mapping fallback
- Push-based MQTT publishing to an external matrix display

## Layers

- Purpose: Detect changes in ADS-B receiver dump file and parse JSON payload
- Location: [`flightscanner.js:47-64`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L47-L64)
- Contains: `chokidar` handler, `fs.promises.readFile`, `JSON.parse`
- Depends on: Local filesystem (`/run/dump1090-fa/aircraft.json`)
- Used by: Processing pipeline
- Purpose: Apply coordinate bounding box and altitude limits; filter out duplicate consecutive sightings
- Location: [`flightscanner.js:59-74`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L59-L74)
- Contains: Array filter predicates, state comparison against `lastFlight`
- Depends on: Raw JSON aircraft array
- Used by: Enrichment step
- Purpose: Query external adsbdb.com API and match ICAO type against local CSV data
- Location: [`flightscanner.js:76-87, 111-121, 123-134`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L76-L87)
- Contains: HTTP REST call, CSV array lookup
- Depends on: `axios`, `papaparse`, network access to `api.adsbdb.com`
- Used by: Notification layer
- Purpose: Build UI payload with icon ID and localized text, publish via MQTT
- Location: [`flightscanner.js:138-178`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L138-L178)
- Contains: Icon lookup table, text generation logic, `mqttClient.publish`
- Depends on: `mqtt` client connection
- Used by: Ingestion layer on successful flight detection

## Data Flow

### Primary Request Path

- Module-level variable `lastFlight` holds the most recently notified flight callsign string to avoid duplicate spam.
- In-memory array `aircraftTypes` holds preloaded CSV rows for ICAO lookups.

## Key Abstractions

- Purpose: Structured payload formatted for Awtrix matrix screen display
- Examples: [`flightscanner.js:173`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L173)
- Pattern: Object literal with icon ID, repeat count, scroll speed, and display text

## Entry Points

- Location: [`flightscanner.js`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js)
- Triggers: Node.js process startup (`node flightscanner.js`)
- Responsibilities: Initializes MQTT client, loads aircraft types CSV stream, registers process exit signals, and starts file watching

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop
- **Global state:** Mutable top-level variables `lastFlight` and `aircraftTypes` in [`flightscanner.js:16, 125`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L16)
- **Circular imports:** None (single-file architecture)
- **Error handling:** Partial try/catch blocks in async callbacks; network or file errors log to console and fall back to default notifications

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.agents/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
