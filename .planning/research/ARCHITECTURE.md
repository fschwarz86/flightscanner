# Research: System Architecture

**Research Date:** 2026-08-27

## Modular Service Pipeline

```text
+-----------------------------------------------------------------+
|                      Configuration Layer                        |
|   Resolves /etc/flightscanner/config.json -> .env -> defaults   |
+--------------------------------+--------------------------------+
                                 |
                                 v
+-----------------------------------------------------------------+
|                    Dump1090 File Watcher                        |
|     (Chokidar + Debounced JSON Parser on aircraft.json)         |
+--------------------------------+--------------------------------+
                                 | Emits parsed aircraft records
                                 v
+-----------------------------------------------------------------+
|                Geofence & Altitude Filter                       |
|    (Filters lat/lon boundaries, altitude, valid callsigns)      |
+--------------------------------+--------------------------------+
                                 | Emits matching aircraft candidates
                                 v
+-----------------------------------------------------------------+
|            Flight Tracker & Cooldown Manager                    |
|    (Tracks seen callsigns, manages active flight cooldowns)     |
+--------------------------------+--------------------------------+
                                 | Dispatches new flight events
                                 v
+-----------------------------------------------------------------+
|             Multi-Provider Enrichment Service                   |
|   1. Flightradar24 Provider                                     |
|   2. adsbdb.com Provider (fallback)                             |
|   3. Local CSV Aircraft Lookup (fallback)                       |
|   4. In-memory Route Cache (TTL 2-4h)                           |
+--------------------------------+--------------------------------+
                                 | Enriched Flight Object
                                 v
+-----------------------------------------------------------------+
|                  Awtrix Message Formatter                       |
|    (Selects airline icon, formats localized German string)      |
+--------------------------------+--------------------------------+
                                 |
                                 v
+-----------------------------------------------------------------+
|                 MQTT Publisher Service                          |
|     (Publishes to awtrix/cmd/notify with auto-reconnect)        |
+-----------------------------------------------------------------+
```

## Architectural Highlights

1. **Separation of Concerns**: Monolith replaced with decoupled modules (`config`, `watcher`, `filter`, `enricher`, `notifier`, `service`).
2. **Provider Strategy Pattern**: Unified interface `enrichFlight({ hex, callsign }): Promise<FlightDetails>` allowing seamless fallback across providers.
3. **Resilience & Fault Tolerance**:
   - File read errors (e.g. dump1090 partial write) are caught and ignored safely without killing the process.
   - MQTT network disconnects automatically queue notifications and reconnect with exponential backoff.
   - Unhandled exceptions are isolated per flight event so the watcher stays alive 24/7.

---
*Research: Architecture analysis 2026-08-27*
