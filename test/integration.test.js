const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { startApp } = require("../src/index");
const { clearAircraftTypes } = require("../src/services/enrichment");

describe("End-to-End Pipeline Integration Test", () => {
  let tempDir;
  let aircraftJsonPath;
  let aircraftCsvPath;
  let publishedMessages = [];
  let app;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "flightscanner-e2e-"));
    aircraftJsonPath = path.join(tempDir, "aircraft.json");
    aircraftCsvPath = path.join(tempDir, "aircraft_types.csv");
    publishedMessages = [];

    // Initialize empty aircraft.json
    fs.writeFileSync(aircraftJsonPath, JSON.stringify({ now: Date.now() / 1000, aircraft: [] }), "utf8");

    // Initialize test aircraft types CSV
    const csvData = `Designator,Manufacturer,Model,Description
A320,Airbus,A320-200,Landplane
B738,Boeing,737-800,Landplane
`;
    fs.writeFileSync(aircraftCsvPath, csvData, "utf8");
    clearAircraftTypes();
  });

  afterEach(async () => {
    if (app) {
      await app.stop();
      app = null;
    }
    clearAircraftTypes();
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("should process aircraft telemetry file update, enrich route, and publish MQTT notification", async () => {
    const mockMqttClient = {
      publish: (topic, message, opts, cb) => {
        publishedMessages.push({
          topic,
          payload: JSON.parse(message),
          opts
        });
        if (typeof cb === "function") cb(null);
      },
      end: (force) => {}
    };

    const mockFrApi = {
      async getFlights(airline, bounds, registration) {
        if (registration === "D-AIUW") {
          return [{
            id: "fr-12345",
            callsign: "DLH123",
            registration: "D-AIUW",
            originAirportIata: "MUC",
            destinationAirportIata: "HAM",
            airlineIcao: "DLH",
            aircraftCode: "A320"
          }];
        }
        return [];
      },
      async getFlightDetails(flight) {
        return {
          airline: { name: "Lufthansa" },
          airport: {
            origin: { name: "Munich", code: { iata: "MUC" } },
            destination: { name: "Hamburg (HAM)", code: { iata: "HAM" } }
          },
          aircraft: {
            model: { text: "Airbus A320-214", code: "A320" }
          }
        };
      }
    };

    // Override process.env paths for config loader
    process.env.DUMP1090_FILE_PATH = aircraftJsonPath;
    process.env.AIRCRAFT_TYPES_CSV_PATH = aircraftCsvPath;
    process.env.GEOFENCE_MIN_LAT = "53.65";
    process.env.GEOFENCE_MAX_LAT = "53.72";
    process.env.GEOFENCE_MIN_LON = "10.10";
    process.env.GEOFENCE_MAX_LON = "10.20";
    process.env.ALTITUDE_MIN_FT = "2000";
    process.env.ALTITUDE_MAX_FT = "10000";
    process.env.FLIGHT_COOLDOWN_MS = "60000"; // 1 min cooldown
    process.env.ROUTE_CACHE_TTL_MS = "300000";

    app = await startApp({
      mockMqttClient,
      frApiInstance: mockFrApi,
      delayBetweenFlightsMs: 10
    });

    // 1. Write aircraft inside geofence
    const mockAircraftData = {
      now: Date.now() / 1000,
      aircraft: [
        {
          hex: "3c66b7",
          flight: "DLH123",
          r: "D-AIUW",
          t: "A320",
          lat: 53.68,
          lon: 10.15,
          alt_baro: 4500,
          speed: 240
        }
      ]
    };

    // Trigger watcher by writing file
    fs.writeFileSync(aircraftJsonPath, JSON.stringify(mockAircraftData), "utf8");

    // Allow watcher debounce and queue processing to finish
    await new Promise((r) => setTimeout(r, 400));

    assert.equal(publishedMessages.length, 1);
    const notification = publishedMessages[0];
    assert.equal(notification.topic, "awtrix/cmd/notify");
    assert.equal(notification.payload.icon, "24591"); // Lufthansa icon
    assert.match(notification.payload.text, /Lufthansa Flug DLH123/);
    assert.match(notification.payload.text, /Airbus A320/);
    assert.match(notification.payload.text, /MUC/);

    // 2. Immediate second write of the same flight should be suppressed by cooldown
    fs.writeFileSync(aircraftJsonPath, JSON.stringify(mockAircraftData), "utf8");
    await new Promise((r) => setTimeout(r, 300));

    // Still exactly 1 notification sent
    assert.equal(publishedMessages.length, 1);

    // 3. Clean shutdown
    await app.stop();
    app = null;
  });

  it("should ignore aircraft outside the bounding box and altitude limits", async () => {
    const mockMqttClient = {
      publish: (topic, message, opts, cb) => {
        publishedMessages.push({ topic, payload: JSON.parse(message) });
        if (typeof cb === "function") cb(null);
      },
      end: () => {}
    };

    process.env.DUMP1090_FILE_PATH = aircraftJsonPath;
    process.env.AIRCRAFT_TYPES_CSV_PATH = aircraftCsvPath;

    app = await startApp({
      mockMqttClient,
      delayBetweenFlightsMs: 10
    });

    // Aircraft outside geofence (lat 55.0 is too far north)
    const outOfBoundsData = {
      now: Date.now() / 1000,
      aircraft: [
        {
          hex: "112233",
          flight: "FAR_AWAY",
          lat: 55.0,
          lon: 10.15,
          alt_baro: 5000
        },
        {
          hex: "445566",
          flight: "TOO_HIGH",
          lat: 53.68,
          lon: 10.15,
          alt_baro: 35000 // Above 10000ft limit
        }
      ]
    };

    fs.writeFileSync(aircraftJsonPath, JSON.stringify(outOfBoundsData), "utf8");
    await new Promise((r) => setTimeout(r, 300));

    assert.equal(publishedMessages.length, 0);

    await app.stop();
    app = null;
  });
});
