# Research: Features & Flight Tracking Patterns

**Research Date:** 2026-08-27

## Essential Capabilities

### 1. Robust Geofenced Filtering
- Multi-dimensional bounding box: Latitude bounds (`[minLat, maxLat]`), Longitude bounds (`[minLon, maxLon]`), and Altitude range (`[minAlt, maxAlt]` in feet barometric).
- Configurable bounding box via config without requiring code changes.

### 2. Multi-Provider Route & Airline Enrichment Chain
- **Step 1 (Primary)**: Query Flightradar24 by callsign or hex registration for live route (origin IATA/municipality, destination IATA/municipality), operating airline, aircraft model.
- **Step 2 (Secondary Fallback)**: Query adsbdb.com API if Flightradar24 returns 404, rate limits, or network timeout.
- **Step 3 (Tertiary Fallback)**: Local CSV lookup for ICAO aircraft model and default unknown route formatting (`Flug {callsign} (keine Daten)`).
- **Rate-Limiting & Caching**: Cache resolved flight routes for 2-4 hours to prevent redundant external API hits as planes loiter in airspace.

### 3. Multi-Aircraft Queue & Cooldown Management
- Instead of inspecting only `filteredData[0]`, evaluate all aircraft within the geofence.
- Maintain an active sighting state with timestamp-based cooldown (e.g. 10-15 minutes per callsign) so the same plane does not re-trigger notifications continuously.
- Sequential notification queue to avoid overlapping display commands to Awtrix.

### 4. Resilient MQTT Notification Output
- Standardized payload formatting for Awtrix pixel displays:
  - Airline icon ID mapping (Lufthansa: 24591, Swiss: 24604, BA: 24607, Turkish: 24629, SAS: 24608, KLM: 24528, Iberia: 24590, Emirates: 54545, Air France: 52241, ITA: 24605, Eurowings: 58999, Default: 15302).
  - Clean German formatting: `{Airline} Flug {Callsign} ({Aircraft}) -> {Destination}` or `<- {Origin}`.

### 5. Headless Daemon & Logging
- Structured console logs formatted for `journalctl`.
- Health check / periodic telemetry heartbeat option.

---
*Research: Features analysis 2026-08-27*
