# Requirements: Flightscanner

**Defined:** 2026-08-27
**Core Value:** Reliably capture local overhead flights and deliver rich, accurate flight route notifications to the Awtrix display with zero unhandled crashes or dropped flight events.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Configuration & Daemon (CONF)

- [x] **CONF-01**: Multi-source configuration loader resolving from `/etc/flightscanner/config.json`, `/etc/default/flightscanner`, `.env`, and default settings
- [x] **CONF-02**: Systemd service unit file (`flightscanner.service`) and installation guide for 24/7 background operation
- [x] **CONF-03**: Configurable geofence coordinates, altitude bounds, MQTT broker connection, and file paths via config without code modification

### Flight Enrichment & Caching (ENRICH)

- [x] **ENRICH-01**: Flightradar24 client provider fetching live route (origin, destination), operating airline, and aircraft model
- [x] **ENRICH-02**: Resilient fallback to adsbdb.com API when Flightradar24 is unavailable or fails
- [x] **ENRICH-03**: Local CSV fallback lookup (`/etc/flightdata/aircraft_types.csv`) for ICAO aircraft types when external APIs fail
- [x] **ENRICH-04**: Lightweight local route cache with configurable TTL (2-4 hours) to minimize API calls and prevent rate limiting

### Tracking & Multi-Aircraft Queue (TRACK)

- [x] **TRACK-01**: Non-blocking dump1090 file watcher on `/run/dump1090-fa/aircraft.json` with debounced, safe JSON parsing
- [x] **TRACK-02**: Spatial & altitude filter evaluating all aircraft against coordinate boundaries and altitude limits
- [x] **TRACK-03**: Multi-aircraft evaluation queue to track and process all qualifying aircraft in the geofence
- [x] **TRACK-04**: Per-flight callsign cooldown tracking with TTL (10-15m) to prevent repeated notification bursts

### Notifications & MQTT Output (NOTIFY)

- [x] **NOTIFY-01**: Awtrix MQTT publisher with automatic reconnection and error isolation publishing to `awtrix/cmd/notify`
- [x] **NOTIFY-02**: Airline icon mapping table for major carriers (Lufthansa, Swiss, BA, Turkish, SAS, KLM, Iberia, Emirates, Air France, ITA, Eurowings, etc.) with default fallback
- [x] **NOTIFY-03**: German localized notification string formatting with directional indicators (`-> {Destination}` / `<- {Origin}`)

### Quality & Testing (TEST)

- [x] **TEST-01**: Comprehensive automated unit test suite covering config loading, coordinate filtering, provider fallbacks, cache TTL, and message formatting

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Extended Integrations

- **EXT-01**: Webhook / Home Assistant entity state updates in addition to Awtrix MQTT notifications
- **EXT-02**: Historical flight logging database (SQLite/PostgreSQL)
- **EXT-03**: Quiet hours / time-of-day notification mute schedule

## Out of Scope

| Feature | Reason |
|---------|--------|
| Web UI / Dashboard | Awtrix pixel clock display and MQTT are the primary UI targets |
| Paid Flightradar24 API keys | Free / unofficial client integration with rate limit safeguards is sufficient |
| Mock/Replay dev simulation mode | Focus on live dump1090 receiver production runtime |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONF-01 | Phase 1 | Complete |
| CONF-02 | Phase 4 | Complete |
| CONF-03 | Phase 1 | Complete |
| ENRICH-01 | Phase 2 | Complete |
| ENRICH-02 | Phase 2 | Complete |
| ENRICH-03 | Phase 2 | Complete |
| ENRICH-04 | Phase 2 | Complete |
| TRACK-01 | Phase 3 | Complete |
| TRACK-02 | Phase 3 | Complete |
| TRACK-03 | Phase 3 | Complete |
| TRACK-04 | Phase 3 | Complete |
| NOTIFY-01 | Phase 3 | Complete |
| NOTIFY-02 | Phase 3 | Complete |
| NOTIFY-03 | Phase 3 | Complete |
| TEST-01 | Phase 4 | Complete |

**Coverage:**

- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0 ✓

---
*Requirements defined: 2026-08-27*
*Last updated: 2026-08-27 after initial definition*
