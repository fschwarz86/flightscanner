# Roadmap: Flightscanner

## Overview

Refactor and harden the Flightscanner service from a single-file prototype into a modular, production-ready daemon. The service enriches local ADS-B dump1090 telemetry with primary Flightradar24 lookup, adsbdb.com fallback, local CSV metadata, and in-memory TTL caching, queueing multi-aircraft detections and publishing formatted notifications to an Awtrix pixel clock over MQTT, deployable as a 24/7 systemd service.

## Phases

- [x] **Phase 1: Architecture & Multi-Source Configuration** - Package setup, service modularization, and config loading (/etc, .env, defaults) (completed 2026-08-27)
- [ ] **Phase 2: Multi-Provider Flight Enrichment & Caching** - Flightradar24 client, adsbdb.com fallback, CSV parser, and TTL cache
- [ ] **Phase 3: Telemetry Watcher, Multi-Aircraft Queue & Awtrix MQTT Notifier** - Debounced watcher, bounding box filter, cooldown queue, and MQTT publisher
- [ ] **Phase 4: Systemd Service Integration & Automated Test Suite** - Comprehensive unit tests, systemd unit file, and daemon installation guide

## Phase Details

### Phase 1: Architecture & Multi-Source Configuration

**Goal:** Establish package foundation, modular service architecture, and hierarchical config resolution.
**Mode:** mvp
**Depends on:** Nothing (first phase)
**Requirements:** CONF-01, CONF-03
**Success Criteria**:

  1. Package.json is initialized with dependencies, scripts (`npm start`, `npm test`), and modular directory structure.
  2. Configuration loader resolves settings hierarchically from `/etc/flightscanner/config.json`, `/etc/default/flightscanner`, `.env`, and safe defaults without hardcoded secrets.
  3. Bounding box coordinates, altitude limits, file paths, and MQTT credentials are fully configurable via config.

**Plans**: 2 plans

Plans:

- [x] 01-01: Initialize package.json, directory layout, logger, and hierarchical config loader
- [x] 01-02: Unit tests for config loading, fallback resolution, and environment overrides

### Phase 2: Multi-Provider Flight Enrichment & Caching

**Goal:** Implement resilient multi-provider flight route and airline metadata enrichment with TTL caching.
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** ENRICH-01, ENRICH-02, ENRICH-03, ENRICH-04
**Success Criteria**:

  1. Primary Flightradar24 provider retrieves flight route (origin, destination), operating airline, and aircraft model.
  2. Fallback provider chain seamlessly queries adsbdb.com and local CSV when Flightradar24 fails or times out.
  3. In-memory/file cache stores flight route lookups with TTL (2-4 hours) to avoid repetitive external API queries.

**Plans**: 2 plans

Plans:

- [ ] 02-01: Build Flightradar24 provider, adsbdb.com fallback, and CSV ICAO aircraft type resolver
- [ ] 02-02: Implement route cache manager with TTL and write comprehensive provider fallback unit tests

### Phase 3: Telemetry Watcher, Multi-Aircraft Queue & Awtrix MQTT Notifier

**Goal:** Connect dump1090-fa file watcher, multi-aircraft bounding box evaluation queue, cooldown tracker, and Awtrix MQTT publisher.
**Mode:** mvp
**Depends on:** Phase 2
**Requirements:** TRACK-01, TRACK-02, TRACK-03, TRACK-04, NOTIFY-01, NOTIFY-02, NOTIFY-03
**Success Criteria**:

  1. Non-blocking watcher safely parses `/run/dump1090-fa/aircraft.json` with debouncing, resilient against partial writes.
  2. Multi-aircraft evaluation queue checks all aircraft in the bounding box and dispatches notifications sequentially.
  3. Per-flight callsign cooldown prevents duplicate alerts for the same flight.
  4. Formatted German messages with airline icon mapping are published to Awtrix MQTT (`awtrix/cmd/notify`) with automatic reconnection.

**Plans**: 2 plans

Plans:

- [ ] 03-01: Build debounced dump1090 watcher, bounding box filter, and multi-aircraft cooldown tracker
- [ ] 03-02: Build Awtrix MQTT publisher with icon mapping, German message formatting, and reconnect handling

### Phase 4: Systemd Service Integration & Automated Test Suite

**Goal:** Complete end-to-end service orchestration, automated test coverage, and systemd daemon installation assets.
**Mode:** mvp
**Depends on:** Phase 3
**Requirements:** CONF-02, TEST-01
**Success Criteria**:

  1. Complete automated unit and integration test suite runs and passes cleanly via `npm test`.
  2. Systemd service unit template (`flightscanner.service`) and installation instructions enable 24/7 background operation.
  3. Service gracefully handles SIGTERM/SIGINT with clean resource disposal.

**Plans**: 2 plans

Plans:

- [ ] 04-01: Integrate service entrypoint with lifecycle management and end-to-end integration test suite
- [ ] 04-02: Create systemd service unit template and production installation guide

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Architecture & Multi-Source Configuration | 2/2 | Complete    | 2026-08-27 |
| 2. Multi-Provider Flight Enrichment & Caching | 0/2 | Not started | - |
| 3. Telemetry Watcher, Multi-Aircraft Queue & Awtrix MQTT Notifier | 0/2 | Not started | - |
| 4. Systemd Service Integration & Automated Test Suite | 0/2 | Not started | - |
