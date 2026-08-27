# Codebase Structure

**Analysis Date:** 2026-08-27

## Directory Layout

```
flightscanner/
├── flightscanner.js    # Single-file application script containing all application logic
└── .planning/          # Project planning and codebase documentation
    └── codebase/       # Structured codebase map documentation
```

## Directory Purposes

**`flightscanner/` (Root):**
- Purpose: Root workspace directory containing the executable script and configuration
- Contains: JavaScript source code and repository metadata
- Key files: [`flightscanner.js`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js)

**`.planning/codebase/`:**
- Purpose: Architecture, stack, convention, and codebase map documentation generated during GSD onboarding
- Contains: Markdown reference documentation
- Key files: `STACK.md`, `ARCHITECTURE.md`, `STRUCTURE.md`, `CONVENTIONS.md`, `TESTING.md`, `INTEGRATIONS.md`, `CONCERNS.md`

## Key File Locations

**Entry Points:**
- [`flightscanner.js`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js): Application entry point and orchestrator

**Configuration:**
- [`flightscanner.js:7-14`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L7-L14): Inline constants for filesystem paths, MQTT endpoints, and topics

**Core Logic:**
- [`flightscanner.js:47-109`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L47-L109): `watchFile()` - File watcher and flight filter
- [`flightscanner.js:111-121`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L111-L121): `fetchFlightData()` - API integration
- [`flightscanner.js:138-178`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js#L138-L178): `notifyDisplay()` - Message formatter and MQTT publisher

**Testing:**
- None detected

## Naming Conventions

**Files:**
- Flat lowercase: `flightscanner.js`

**Directories:**
- Dot-prefixed for metadata/planning: `.planning/`, `.git/`

## Where to Add New Code

**New Feature (e.g., additional filters, new notification providers):**
- Primary code: Currently inside [`flightscanner.js`](file:///usr/local/google/home/fschwarz/spark/flightscanner/flightscanner.js) (or extract into modular files under `src/`)
- Tests: Create `tests/` directory and add unit tests (e.g., `tests/flightscanner.test.js`)

**New Component/Module (e.g., config loader, MQTT client wrapper):**
- Implementation: Recommended to create `src/` or `lib/` modules (e.g., `src/config.js`, `src/mqtt.js`, `src/adsb.js`)

**Utilities:**
- Shared helpers: `src/utils.js` or `lib/helpers.js`

## Special Directories

**`.planning/`:**
- Purpose: GSD project planning artifacts, requirements, and codebase mappings
- Generated: Yes
- Committed: Yes

**`.git/`:**
- Purpose: Git version control repository metadata
- Generated: Yes
- Committed: No

---

*Structure analysis: 2026-08-27*
