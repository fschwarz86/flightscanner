# Codebase Concerns

**Analysis Date:** 2026-08-27

## Tech Debt

**Single-file monolith with missing package management:**
- Issue: [`flightscanner.js`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js) contains all application logic, configuration, and dependencies in a single file without `package.json` to define dependencies.
- Files: [`flightscanner.js`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js)
- Impact: Difficult to install dependencies reliably, run automated tests, or maintain modular components.
- Fix approach: Initialize `package.json`, add dependency declarations (`mqtt`, `axios`, `chokidar`, `papaparse`), and refactor into modular services (e.g. `config.js`, `adsbWatcher.js`, `flightApi.js`, `mqttNotifier.js`).

**Hardcoded credentials and system paths:**
- Issue: MQTT credentials (`username`, `password`), broker host, and Linux absolute file paths (`/run/dump1090-fa/aircraft.json`, `/etc/flightdata/aircraft_types.csv`) are hardcoded in the source file.
- Files: [`flightscanner.js:7-14`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L7-L14)
- Impact: Security exposure if pushed to public git repositories; non-portable across environments.
- Fix approach: Move credentials and configuration to environment variables (e.g. via `dotenv`) or a structured config file (`config.json`).

## Known Bugs

**Async race condition / unhandled property access on API failure:**
- Symptoms: When `fetchFlightData` catches an error (e.g., network error or 404), it catches the error, logs it, and returns `undefined`. In [`flightscanner.js:81`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L81), `flightData.flightroute.airline.name` will throw `TypeError: Cannot read properties of undefined (reading 'flightroute')`. While caught by the outer catch block ([`flightscanner.js:91`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L91)), the error message logged indicates "Error getting flight data" with an uninformative trace.
- Files: [`flightscanner.js:81-98, 117-120`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L81-L98)
- Trigger: Aircraft with callsign not found in adsbdb.com or API downtime.
- Workaround: Handled by outer try/catch, but should return a null/safe object or rethrow cleanly.

**CSV lookup index crash on missing aircraft type:**
- Symptoms: If `aircraftTypes.map(...).indexOf(...)` returns `-1`, indexing `aircraftTypes[-1].Clear` in [`flightscanner.js:86`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L86) throws `TypeError: Cannot read properties of undefined (reading 'Clear')`.
- Files: [`flightscanner.js:84-86`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L84-L86)
- Trigger: ICAO aircraft type not present in the CSV database.
- Workaround: Outer catch block catches error and triggers fallback notification, but aircraft type is lost.

## Security Considerations

**Hardcoded MQTT credentials in version control:**
- Risk: Password exposure in source code.
- Files: [`flightscanner.js:12`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L12)
- Current mitigation: None in code.
- Recommendations: Replace with environment variables (`process.env.MQTT_PASSWORD`).

## Performance Bottlenecks

**Repeated linear search over CSV array:**
- Problem: `aircraftTypes.map(function(o) { return o.ICAO; }).indexOf(...)` in [`flightscanner.js:84`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L84) allocates a new array of all ICAO codes and performs linear search on every single detected flight.
- Files: [`flightscanner.js:84-86`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L84-L86)
- Cause: Array lookup instead of hash map indexing.
- Improvement path: Convert `aircraftTypes` into a `Map` or key-value object indexed by `ICAO` during initial CSV stream parsing.

## Fragile Areas

**Single flight processing (`filteredData[0]`):**
- Files: [`flightscanner.js:68`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L68)
- Why fragile: If multiple aircraft enter the bounding box simultaneously, only `filteredData[0]` is evaluated. If that aircraft remains in the box, subsequent aircraft behind it in the array are ignored.
- Safe modification: Iterate over all aircraft in `filteredData` and track recently seen flights with timestamps.
- Test coverage: No tests currently exist.

## Scaling Limits

**File watch frequency on high-traffic receiver:**
- Current capacity: Handles single changes on `aircraft.json` (dump1090 writes typically once per second).
- Limit: If write rate increases, rapid async file reads could overlap or read partially written JSON.
- Scaling path: Debounce file change events or read via stream/atomic lock.

## Dependencies at Risk

**Missing package.json manifest:**
- Risk: Dependency version pinning missing; npm install will fail without `package.json`.
- Impact: Cannot recreate exact dependency versions in CI or other environments.
- Migration plan: Run `npm init` and `npm install chokidar mqtt axios papaparse`.

## Missing Critical Features

**Missing configuration file / CLI parameters:**
- Problem: Bounding box coordinates (lat 53.65-53.72, lon 10.10-10.20), altitude range, and MQTT settings cannot be configured without editing code.
- Blocks: Deploying to different geographic locations or airports without code edits.

## Test Coverage Gaps

**Entire codebase:**
- What is not tested: All file watching, coordinate filtering, API requests, CSV lookup, and MQTT notification formatting.
- Files: [`flightscanner.js`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js)
- Risk: Regressions when modifying parsing, filtering, or display logic.
- Priority: High

---

*Concerns audit: 2026-08-27*
