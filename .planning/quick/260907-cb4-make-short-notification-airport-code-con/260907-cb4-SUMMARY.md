---
quick_id: 260907-cb4
slug: make-short-notification-airport-code-con
title: "Make short notification airport code configurable and match strictly by airport code (excluding XFW)"
date: "2026-09-07"
duration: "4m"
status: completed
commit: 60c384a
files_modified:
  - config/default-flightscanner.example
  - config/flightscanner.json.example
  - src/config/defaults.js
  - src/config/index.js
  - src/services/notification/formatter.js
  - src/services/notification/mqtt.js
  - test/config.test.js
  - test/formatter.test.js
  - test/mqtt.test.js
---

# Quick Task Summary: 260907-cb4

Configured the base airport code for short notifications (defaulting to "HAM") and restricted notification shortening strictly to the configured airport code (`(${baseAirport})` or `${baseAirport}`). This prevents other airports sharing the "Hamburg" city name (specifically Hamburg Finkenwerder / XFW) from being mistaken for the base airport.

## Key Changes

1. **Airport Code Matching & XFW Disambiguation**:
   - Replaced loose city prefix matching (`.startsWith("hamburg")`) with `isBaseAirport(formattedAirport, baseAirportCode)` checking strictly for parenthesized code `(${code})` or exact code `${code}`.
   - Added `"XFW": "Hamburg-Finkenwerder"` and `"TLS": "Toulouse"` to `AIRPORT_CITIES`.
   - Flights with origin or destination at XFW now retain their full origin/destination route (e.g. `Toulouse (TLS) -> Hamburg-Finkenwerder (XFW)`), and are never shortened as HAM.

2. **Configurable Base Airport**:
   - Added `baseAirport: "HAM"` to `defaultConfig` in `src/config/defaults.js`.
   - Added environment mappings for `BASE_AIRPORT` and `HOME_AIRPORT` in `src/config/index.js`.
   - Added validation for `baseAirport` in `validateConfig`.
   - Updated `config/flightscanner.json.example` and `config/default-flightscanner.example`.
   - Wired `config.baseAirport` through `createMqttPublisher` in `src/services/notification/mqtt.js` to `formatNotificationPayload` and `formatNotificationText`.

3. **Comprehensive Tests**:
   - Added `isBaseAirport` unit test suite in `test/formatter.test.js`.
   - Added tests ensuring XFW as destination or origin is never omitted.
   - Added tests verifying custom configured `baseAirport` (e.g., "BER", "MUC") correctly controls shortening.
   - Added unit tests for default, JSON, and env overrides of `baseAirport` in `test/config.test.js`.
   - Added unit test in `test/mqtt.test.js` verifying publisher formats notifications according to `config.baseAirport`.

## Verification Results

- `npm test`: 73/73 tests passing across 16 test suites (0 failures).
