# Flightscanner

## What This Is

A real-time ADS-B flight tracking and notification service for local airspace monitoring. It observes local receiver telemetry from dump1090-fa, enriches flight data with airline and route details via Flightradar24 and adsbdb.com, and sends formatted visual alerts to an Awtrix LED matrix display via MQTT. Designed for robust, headless 24/7 operation as a Linux systemd service.

## Core Value

Reliably capture local overhead flights and deliver rich, accurate flight route notifications to the Awtrix display with zero unhandled crashes or dropped flight events.

## Requirements

### Validated

- ✓ Watch dump1090-fa `aircraft.json` for file changes — existing
- ✓ Geofence filtering by latitude, longitude, and altitude boundaries — existing
- ✓ Publish formatted JSON notifications with airline icon and German text to Awtrix MQTT topic (`awtrix/cmd/notify`) — existing
- ✓ ICAO aircraft type mapping via CSV (`/etc/flightdata/aircraft_types.csv`) — existing

### Active

- [ ] Modularize codebase with `package.json` and clean service architecture (config, watcher, enricher, notifier)
- [ ] Integrate Flightradar24 API as primary flight enrichment provider with fallback to adsbdb.com and local CSV lookup
- [ ] Multi-source configuration management supporting `/etc/flightscanner/config.json`, `/etc/default/flightscanner`, `.env`, and defaults
- [ ] Resilient error handling, automatic MQTT reconnects, network failure fallbacks, and structured logging
- [ ] Multi-aircraft tracking queue with per-flight cooldown/debounce to handle multiple simultaneous aircraft gracefully
- [ ] Automated unit and integration test suite with high test coverage
- [ ] Systemd service unit template and installation guide for 24/7 daemon deployment

### Out of Scope

- Web UI / dashboard — Awtrix matrix display and MQTT notifications are the primary presentation targets
- Paid Flightradar24 API keys — Free/unofficial client integration with rate limit safeguards
- Local mock/replay simulation mode — Focus on production live dump1090 receiver runtime

## Context

- Existing prototype is a single-file script ([`flightscanner.js`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js)) with hardcoded credentials and linux paths
- ADS-B source: local dump1090-fa receiver telemetry at `/run/dump1090-fa/aircraft.json`
- MQTT broker target: Home Assistant Mosquitto (`homeassistant:1883`)
- Matrix screen: Awtrix 2/3 (`awtrix/cmd/notify`)
- Deployment environment: Linux host (Raspberry Pi / server) running under systemd

## Constraints

- **Runtime**: Node.js (v18+)
- **Systemd compatibility**: Config must resolve from `/etc/flightscanner/` or environment variables without manual code edits
- **Performance**: Lightweight memory and CPU footprint suitable for single-board computers

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Primary Flightradar24 with adsbdb.com fallback | Flightradar24 provides superior route coverage while adsbdb.com and CSV provide robust fallbacks | — Pending |
| Multi-source config (`/etc/`, `.env`, env vars) | Enables clean systemd deployment without hardcoding credentials in version control | — Pending |
| Multi-aircraft queue with cooldown | Prevents notification collisions when multiple aircraft enter the geofence simultaneously | — Pending |
| Modular Node.js service architecture | Decouples watcher, enricher, notifier, and config for unit testability | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-27 after initialization*
