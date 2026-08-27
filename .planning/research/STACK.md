# Research: Technology Stack

**Research Date:** 2026-08-27

## Recommended Stack for Modern Node.js Flight Tracker Service

### Runtime & Language
- **Node.js**: v18.x or v20.x+ LTS (support for built-in fetch, modern fs/promises, node:test, structured clone).
- **Module System**: CommonJS or ECMAScript Modules (ESM) with clean directory separation.

### Core Libraries & Integrations
- **Flight Data Enrichment**:
  - **Primary**: `flightradarapi` (npm package port of FlightRadarAPI) or direct Flightradar24 REST live feed queries.
  - **Fallback**: `axios` / `fetch` to `https://api.adsbdb.com/v0/aircraft/{registration}?callsign={callsign}`.
  - **Reference Data**: `papaparse` for loading and indexing `/etc/flightdata/aircraft_types.csv`.
- **Filesystem Observation**:
  - `chokidar` for cross-platform, non-blocking file change watching on `/run/dump1090-fa/aircraft.json`.
  - Debounce wrapper to avoid reading during partial file write bursts.
- **Messaging & Display Protocol**:
  - `mqtt` (v5.x): Robust client with auto-reconnect, configurable keepalive, backoff, and offline queueing for Home Assistant Mosquitto (`homeassistant:1883`).
- **Configuration & Secrets**:
  - `dotenv` with multi-source fallback resolver: checks `/etc/flightscanner/config.json`, `/etc/default/flightscanner`, local `.env`, and environment variables.
- **Testing & Quality**:
  - Node.js built-in test runner (`node:test` + `node:assert`) or Jest/Vitest for lightweight, dependency-free unit testing without external overhead on single-board computers.

### Deployment & Daemonization
- **systemd**: Native Linux service unit (`flightscanner.service`) with `Restart=always`, `RestartSec=5s`, `StandardOutput=journal`, and unprivileged service user.

---
*Research: Stack analysis 2026-08-27*
