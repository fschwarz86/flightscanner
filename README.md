# Flightscanner ✈️📡

A resilient, real-time ADS-B flight tracking and notification daemon designed for 24/7 headless operation on Linux single-board computers (such as Raspberry Pi).

Flightscanner monitors local airspace telemetry from `dump1090-fa`, enriches sightings with airline, route, and aircraft details via **Flightradar24**, **adsbdb.com**, and local **ICAO CSV data**, and dispatches formatted visual notifications to an **Awtrix Light LED matrix display** via **MQTT**.

---

## 🌟 Key Features

- 🎯 **Geofenced Airspace Ingestion:** Precise coordinate bounding box (`minLat`, `maxLat`, `minLon`, `maxLon`) and altitude window (`minFt`, `maxFt`) filtering.
- 🔄 **Multi-Provider Enrichment with Fallback:**
  1. **Flightradar24** (primary) via `flightradarapi` — retrieves flight origin/destination airports, operating airline, and full aircraft model text.
  2. **adsbdb.com** (secondary fallback) — REST query fallback with timeout protection.
  3. **Local ICAO CSV** (tertiary fallback) — translates raw ICAO designators (e.g., `A320`) into friendly names (e.g., `Airbus A320`).
- ⚡ **TTL Route Caching:** In-memory caching (default: 4 hours) eliminates redundant external API lookups for known flights and protects against rate limiting.
- 🛡️ **Debounce Queue & Cooldown Management:**
  - Per-flight cooldown window (default: 30 minutes) prevents duplicate alert spam for loitering aircraft.
  - Multi-aircraft FIFO queue spaces out notifications to prevent overlapping animations on the Awtrix matrix.
- 🇩🇪 **Localized German Notifications:** Custom text formatting for arrivals, departures, and partial routes with airline icon mappings (Lufthansa, Eurowings, British Airways, KLM, Air France, Emirates, etc.).
- 🐧 **Production Systemd Daemon:** Designed for 24/7 background service execution with structured `journalctl` logging, automatic restart (`Restart=always`), and multi-tier configuration (`/etc/` support).
- 🧪 **Comprehensive Automated Test Suite:** 47 unit and integration tests with 100% pass rate.

---

## 🏗️ Architecture

```
                                  ┌──────────────────────────────┐
                                  │ dump1090-fa (aircraft.json)  │
                                  └──────────────┬───────────────┘
                                                 │ File Watcher (Chokidar)
                                                 ▼
                                  ┌──────────────────────────────┐
                                  │   Geofence & Altitude Filter │
                                  └──────────────┬───────────────┘
                                                 │ Matches Bounding Box
                                                 ▼
                                  ┌──────────────────────────────┐
                                  │ FlightQueue & Cooldown Check │
                                  └──────────────┬───────────────┘
                                                 │ Serial Dispatch
                                                 ▼
                                  ┌──────────────────────────────┐
                                  │      Enrichment Pipeline     │
                                  │ ┌──────────────────────────┐ │
                                  │ │ 1. In-Memory Route Cache │ │
                                  │ ├──────────────────────────┤ │
                                  │ │ 2. Flightradar24 API     │ │
                                  │ ├──────────────────────────┤ │
                                  │ │ 3. adsbdb.com REST API   │ │
                                  │ ├──────────────────────────┤ │
                                  │ │ 4. Local ICAO CSV Map    │ │
                                  │ └──────────────────────────┘ │
                                  └──────────────┬───────────────┘
                                                 │ Enriched Flight Data
                                                 ▼
                                  ┌──────────────────────────────┐
                                  │ Notification Formatter & Icon│
                                  └──────────────┬───────────────┘
                                                 │ JSON Payload
                                                 ▼
                                  ┌──────────────────────────────┐
                                  │   Awtrix MQTT Publisher      │
                                  │   (awtrix/cmd/notify)        │
                                  └──────────────┬───────────────┘
                                                 │
                                                 ▼
                                    [ Awtrix LED Matrix Display ]
```

---

## 📋 Prerequisites

- **Runtime:** Node.js v18.0.0 or higher
- **ADS-B Telemetry:** Local `dump1090-fa` service producing `/run/dump1090-fa/aircraft.json`
- **MQTT Broker:** Home Assistant Mosquitto or standalone MQTT broker
- **Display:** Awtrix Light / Pixel Clock connected to MQTT
- **Aircraft CSV:** `/etc/flightdata/aircraft_types.csv` (optional, for offline model resolution)

---

## ⚙️ Configuration

Flightscanner resolves configuration hierarchically in the following order of precedence:

1. **Environment Variables** (`process.env`)
2. **Local `.env` file** in the project root
3. **System Environment File:** `/etc/default/flightscanner`
4. **JSON Configuration File:** `/etc/flightscanner/config.json`
5. **Built-in Defaults**

### Configuration Parameters

| Variable | JSON Key | Default | Description |
|---|---|---|---|
| `DUMP1090_FILE_PATH` | `dump1090FilePath` | `/run/dump1090-fa/aircraft.json` | Path to dump1090 aircraft JSON file |
| `AIRCRAFT_TYPES_CSV_PATH` | `aircraftTypesCsvPath` | `/etc/flightdata/aircraft_types.csv` | Path to ICAO aircraft designator CSV |
| `MQTT_BROKER_URL` | `mqtt.brokerUrl` | `mqtt://homeassistant:1883` | MQTT broker connection URL |
| `MQTT_TOPIC` | `mqtt.topic` | `awtrix/cmd/notify` | MQTT topic for Awtrix notifications |
| `MQTT_CLIENT_ID` | `mqtt.clientId` | `flightscanner` | MQTT client identifier |
| `MQTT_USERNAME` | `mqtt.username` | `""` | MQTT username (optional) |
| `MQTT_PASSWORD` | `mqtt.password` | `""` | MQTT password (optional) |
| `GEOFENCE_MIN_LAT` | `geofence.minLat` | `53.65` | Minimum latitude boundary |
| `GEOFENCE_MAX_LAT` | `geofence.maxLat` | `53.72` | Maximum latitude boundary |
| `GEOFENCE_MIN_LON` | `geofence.minLon` | `10.10` | Minimum longitude boundary |
| `GEOFENCE_MAX_LON` | `geofence.maxLon` | `10.20` | Maximum longitude boundary |
| `ALTITUDE_MIN_FT` | `altitude.minFt` | `2000` | Minimum altitude in feet |
| `ALTITUDE_MAX_FT` | `altitude.maxFt` | `10000` | Maximum altitude in feet |
| `FLIGHT_COOLDOWN_MS` | `cooldownMs` | `1800000` (30 min) | Duplicate flight suppression cooldown |
| `ROUTE_CACHE_TTL_MS` | `cacheTtlMs` | `14400000` (4 hours) | In-memory route cache expiration |
| `LOG_LEVEL` | `logLevel` | `info` | Logging verbosity (`debug`, `info`, `warn`, `error`) |

---

## 🚀 Deployment Guide

### Option 1: Development / Local Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/fschwarz/flightscanner.git
   cd flightscanner
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your MQTT host and geofence coordinates
   nano .env
   ```

4. **Run test suite:**
   ```bash
   npm test
   ```

5. **Start service:**
   ```bash
   npm start
   ```

---

### Option 2: Production Systemd Service (Linux / Raspberry Pi)

1. **Deploy application to `/opt/flightscanner`:**
   ```bash
   sudo mkdir -p /opt/flightscanner
   sudo cp -r * /opt/flightscanner/
   cd /opt/flightscanner
   sudo npm install --omit=dev
   ```

2. **Configure system environment:**
   ```bash
   sudo cp /opt/flightscanner/config/default-flightscanner.example /etc/default/flightscanner
   sudo nano /etc/default/flightscanner
   ```
   *(Update your MQTT broker IP, credentials, and geofence coordinates).*

3. **Install and activate the systemd service:**
   ```bash
   sudo cp /opt/flightscanner/systemd/flightscanner.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable flightscanner
   sudo systemctl start flightscanner
   ```

4. **Verify service status:**
   ```bash
   sudo systemctl status flightscanner
   ```

---

## 🔍 Debugging & Troubleshooting

### 1. Inspecting Live Logs with `journalctl`

Flightscanner outputs ISO-timestamped structured logs directly to `systemd` journal:

- **Follow real-time logs:**
  ```bash
  journalctl -u flightscanner -f
  ```

- **Inspect only error messages:**
  ```bash
  journalctl -u flightscanner -p err -e
  ```

- **Enable verbose DEBUG logging:**
  Edit `/etc/default/flightscanner` (or `.env`) and set:
  ```ini
  LOG_LEVEL=debug
  ```
  Then restart the service:
  ```bash
  sudo systemctl restart flightscanner
  ```
  Debug logs will output individual aircraft evaluation metrics, geofence coordinates, cache hits/misses, and MQTT payload details.

---

### 2. Verifying ADS-B Telemetry Source (`dump1090-fa`)

Check if `dump1090-fa` is actively writing valid JSON data:

- **Verify file existence and size:**
  ```bash
  ls -la /run/dump1090-fa/aircraft.json
  ```

- **Watch live telemetry updates:**
  ```bash
  watch -n 1 "head -n 25 /run/dump1090-fa/aircraft.json"
  ```

- **Check if dump1090-fa service is running:**
  ```bash
  sudo systemctl status dump1090-fa
  ```

---

### 3. Verifying MQTT & Awtrix Communication

- **Subscribe to the notification topic to observe published messages:**
  ```bash
  mosquitto_sub -h homeassistant -p 1883 -t "awtrix/cmd/notify" -v
  ```

- **Publish a manual test notification to Awtrix:**
  ```bash
  mosquitto_pub -h homeassistant -p 1883 -t "awtrix/cmd/notify" \
    -m '{"icon":"24591","repeat":2,"scroll":{"speed":50},"text":"Testflug LH123 (A320) HAM -> MUC"}'
  ```

---

### 4. Running the Test Suite

Run the full automated test suite to ensure all subsystems and mocks pass:

```bash
npm test
```

To run individual test modules:
```bash
node --test test/config.test.js
node --test test/enrichment.test.js
node --test test/geofence.test.js
node --test test/queue.test.js
node --test test/formatter.test.js
node --test test/mqtt.test.js
node --test test/integration.test.js
```

---

## 📁 Repository Structure

```
.
├── config/
│   ├── default-flightscanner.example   # Template for /etc/default/flightscanner
│   └── flightscanner.json.example      # Template for /etc/flightscanner/config.json
├── src/
│   ├── config/
│   │   ├── defaults.js                 # Default configuration values
│   │   └── index.js                    # Hierarchical config loader & validator
│   ├── services/
│   │   ├── enrichment/
│   │   │   ├── adsbdb.js               # Secondary adsbdb.com fallback provider
│   │   │   ├── cache.js                # TTL in-memory route cache
│   │   │   ├── csv-aircraft.js         # Local ICAO designator CSV resolver
│   │   │   ├── flightradar.js          # Primary Flightradar24 API client
│   │   │   └── index.js                # Multi-provider enrichment orchestrator
│   │   ├── notification/
│   │   │   ├── formatter.js            # German notification formatter & icon map
│   │   │   └── mqtt.js                 # Resilient MQTT publisher with auto-reconnect
│   │   └── tracking/
│   │       ├── geofence.js             # Geofence & altitude filtering
│   │       ├── queue.js                # Multi-aircraft FIFO queue & cooldown manager
│   │       └── watcher.js              # Chokidar dump1090 file watcher
│   ├── utils/
│   │   └── logger.js                   # Journalctl-friendly structured logger
│   └── index.js                        # Main application entry point & lifecycle hooks
├── systemd/
│   └── flightscanner.service           # Production systemd unit file
├── test/                               # Automated unit & integration tests
├── .env.example                        # Environment variables template
├── package.json
└── README.md
```

---

## 📜 License

MIT License.
