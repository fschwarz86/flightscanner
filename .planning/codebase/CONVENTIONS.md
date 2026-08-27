# Coding Conventions

**Analysis Date:** 2026-08-27

## Naming Patterns

**Files:**
- Flat lowercase: `flightscanner.js`

**Functions:**
- camelCase: `watchFile()`, `fetchFlightData()`, `notifyDisplay()` in [`flightscanner.js:47,111,138`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L47)

**Variables:**
- Mixed camelCase and PascalCase for file streams:
  - `const aircraftFile = ...`
  - `var lastFlight = ""`
  - `const AircraftTypesFileStream = ...` in [`flightscanner.js:123`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L123)
  - `var aircraftTypes = []` in [`flightscanner.js:125`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L125)

**Types / Structures:**
- Plain JavaScript objects: `{ "icon": '' + icon, "repeat": 3, "scroll": { "speed": 50 }, "text": text }` in [`flightscanner.js:173`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L173)

## Code Style

**Formatting:**
- 2-4 spaces indentation
- Semicolons used inconsistently
- Standard JavaScript CommonJS module format (`require(...)`)

**Linting:**
- No linter (ESLint / Biome) configured in project

## Import Organization

**Order:**
1. Node.js standard modules (`fs`) in [`flightscanner.js:1`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L1)
2. Third-party npm dependencies (`axios`, `mqtt`, `chokidar`, `papaparse`) in [`flightscanner.js:2-5`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L2-L5)

**Path Aliases:**
- None (standard CommonJS relative / package requires)

## Error Handling

**Patterns:**
- `try/catch` blocks around asynchronous operations in [`flightscanner.js:48, 52, 75, 101, 106, 112, 117`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L48)
- Fallback values assigned on API failure in catch block:
  ```javascript
  catch(err) {
      const airline = "Default";
      const origin = "";
      const destination = "";
      const aircraft = "";
      console.error('Error getting flight data:', err);
      notifyDisplay(airline, callsign, origin, destination, aircraft);
  }
  ```

## Logging

**Framework:**
- Native `console.log` and `console.error`

**Patterns:**
- `console.log('MQTT Connected')` on broker connection
- `console.error('Error fetching data:', error.response.status)` on HTTP errors
- Formatted notification strings logged to standard output before sending MQTT message

## Comments

**When to Comment:**
- Minimal inline comments indicating process lifecycle hooks (`//do something when app is closing`, `//catches ctrl+c event`)
- Commented-out debugging statements (`// console.log(...)`)

**JSDoc/TSDoc:**
- Not used

## Function Design

**Size:**
- Small to medium functions (15-60 lines)

**Parameters:**
- Explicit positional arguments: `fetchFlightData(registration, callsign)` and `notifyDisplay(airline, callsign, origin, destination, aircraft)`

**Return Values:**
- Async functions return payload data (`fetchFlightData` returns `flightData`) or void (`watchFile`, `notifyDisplay`)

## Module Design

**Exports:**
- Single monolithic script without module exports

**Barrel Files:**
- Not used

---

*Convention analysis: 2026-08-27*
