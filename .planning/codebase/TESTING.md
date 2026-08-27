# Testing Patterns

**Analysis Date:** 2026-08-27

## Test Framework

**Runner:**
- None configured (no test runner detected)
- Config: None

**Assertion Library:**
- None

**Run Commands:**
```bash
# No test commands currently configured in package.json
```

## Test File Organization

**Location:**
- No test files currently exist in the repository

**Naming:**
- N/A

**Structure:**
- N/A

## Test Structure

**Suite Organization:**
- None

**Patterns:**
- None

## Mocking

**Framework:**
- None

**What to Mock (when implementing tests):**
- `chokidar` file watcher change events
- `fs.promises.readFile` for sample `aircraft.json` payloads
- `axios.get` for adsbdb.com REST responses
- `mqtt.connect` and `mqttClient.publish` for MQTT broker communication
- `papaparse` CSV stream parsing for `/etc/flightdata/aircraft_types.csv`

**What NOT to Mock:**
- Coordinate and altitude filtering logic
- German display string template formatting
- Airline icon ID lookup mapping

## Fixtures and Factories

**Test Data:**
- Recommended test fixtures:
  - Sample `aircraft.json` dump with various latitude, longitude, and altitude values
  - Sample adsbdb.com JSON response fixture
  - Sample `aircraft_types.csv` snippet

**Location:**
- Recommended location: `tests/fixtures/`

## Coverage

**Requirements:**
- None enforced

**View Coverage:**
```bash
# N/A
```

## Test Types

**Unit Tests:**
- Not yet implemented. Recommended for filter logic, coordinate bounding checks, and message formatting.

**Integration Tests:**
- Not yet implemented. Recommended for API client error handling and MQTT payload publishing.

**E2E Tests:**
- Not used

## Common Patterns

**Async Testing:**
- Recommended using standard async/await with Jest, Vitest, or Node built-in test runner (`node --test`)

**Error Testing:**
- Recommended testing catch blocks for API timeouts, 404/500 responses from adsbdb.com, and malformed `aircraft.json` files

---

*Testing analysis: 2026-08-27*
