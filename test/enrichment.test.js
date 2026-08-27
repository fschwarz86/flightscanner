const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { createEnricher, loadAircraftTypes, lookupAircraftType, clearAircraftTypes } = require("../src/services/enrichment");
const { FlightCache } = require("../src/services/enrichment/cache");

describe("Enrichment Pipeline", () => {
  let tempDir;
  let csvPath;

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "flightscanner-enrich-"));
    csvPath = path.join(tempDir, "aircraft_types.csv");
    const mockCsv = `Designator,Manufacturer,Model,Description
A320,Airbus,A320-200,Landplane
B738,Boeing,737-800,Landplane
E190,Embraer,ERJ-190,Landplane
`;
    fs.writeFileSync(csvPath, mockCsv, "utf8");
    clearAircraftTypes();
    await loadAircraftTypes(csvPath);
  });

  afterEach(() => {
    clearAircraftTypes();
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("should lookup aircraft model from CSV by ICAO designator", () => {
    assert.equal(lookupAircraftType("A320"), "Airbus A320-200");
    assert.equal(lookupAircraftType("b738"), "Boeing 737-800");
    assert.equal(lookupAircraftType("UNKNOWN"), null);
  });

  it("should retrieve flight from cache when available without external calls", async () => {
    const cache = new FlightCache();
    const cachedFlight = {
      callsign: "DLH123",
      airline: "Lufthansa",
      origin: "MUC",
      destination: "HAM",
      aircraft: "Airbus A320",
      source: "cached_test"
    };
    cache.set("DLH123", cachedFlight);

    const enricher = createEnricher({
      config: { aircraftTypesCsvPath: csvPath },
      cache
    });

    const result = await enricher.enrichFlight({ flight: "DLH123", r: "D-AIUW" });
    assert.equal(result.source, "cached_test");
    assert.equal(result.airline, "Lufthansa");
    assert.equal(result.origin, "MUC");
    assert.equal(result.destination, "HAM");
  });

  it("should use Mock Flightradar24 API when available", async () => {
    const cache = new FlightCache();
    const mockFrApi = {
      async getFlights(airline, bounds, registration) {
        if (registration === "D-AIUW") {
          return [{
            id: "123",
            callsign: "DLH123",
            registration: "D-AIUW",
            airlineIcao: "DLH",
            originAirportIata: "MUC",
            destinationAirportIata: "HAM",
            aircraftCode: "A320"
          }];
        }
        return [];
      },
      async getFlightDetails(flight) {
        return {
          airline: { name: "Lufthansa" },
          airport: {
            origin: { code: { iata: "MUC" }, name: "Munich Airport" },
            destination: { code: { iata: "HAM" }, name: "Hamburg Airport" }
          },
          aircraft: { model: { text: "Airbus A320-214", code: "A320" } }
        };
      }
    };

    const enricher = createEnricher({
      config: { aircraftTypesCsvPath: csvPath, cacheTtlMs: 5000 },
      cache,
      frApiInstance: mockFrApi
    });

    const result = await enricher.enrichFlight({ flight: "DLH123", r: "D-AIUW", lat: 53.68, lon: 10.15 });
    assert.equal(result.source, "flightradar24");
    assert.equal(result.airline, "Lufthansa");
    assert.equal(result.origin, "MUC");
    assert.equal(result.destination, "HAM");
    assert.equal(result.aircraft, "Airbus A320-214");

    // Verify it was placed in cache
    assert.equal(cache.has("DLH123"), true);
  });

  it("should fallback to CSV aircraft lookup and safe defaults if providers return null", async () => {
    const cache = new FlightCache();
    const mockFrApi = {
      async getFlights() {
        return [];
      }
    };

    const enricher = createEnricher({
      config: { aircraftTypesCsvPath: csvPath },
      cache,
      frApiInstance: mockFrApi
    });

    const result = await enricher.enrichFlight({
      flight: "TEST99",
      r: "D-XXXX",
      t: "B738",
      lat: 53.68,
      lon: 10.15
    });

    assert.equal(result.callsign, "TEST99");
    assert.equal(result.aircraft, "Boeing 737-800"); // resolved from CSV
    assert.equal(result.airline, "Unbekannte Fluggesellschaft");
    assert.equal(result.origin, "Unbekannt");
    assert.equal(result.destination, "Unbekannt");
  });

  it("should handle unexpected errors in enricher gracefully without throwing", async () => {
    const mockBrokenFrApi = {
      async getFlights() {
        throw new Error("Simulated network outage 500");
      }
    };

    const enricher = createEnricher({
      config: {},
      frApiInstance: mockBrokenFrApi
    });

    const result = await enricher.enrichFlight({ flight: "FAIL01", r: "D-FAIL" });
    assert.notEqual(result, null);
    assert.equal(result.callsign, "FAIL01");
    assert.equal(result.source, "fallback");
  });

  it("should identify and record the exact provider used (flightradar24, adsbdb, csv, or fallback)", async () => {
    const mockFrApi = {
      async getFlights(airline, bounds, registration) {
        if (registration === "D-FR24") {
          return [{
            id: "fr-1",
            callsign: "DLH11",
            registration: "D-FR24",
            originAirportIata: "FRA",
            destinationAirportIata: "HAM",
            airlineIcao: "DLH",
            aircraftCode: "A320"
          }];
        }
        return [];
      },
      async getFlightDetails() {
        return {
          airline: { name: "Lufthansa" },
          airport: { origin: { code: { iata: "FRA" } }, destination: { code: { iata: "HAM" } } },
          aircraft: { model: { text: "Airbus A320" } }
        };
      }
    };

    const enricher = createEnricher({
      config: { aircraftTypesCsvPath: csvPath },
      frApiInstance: mockFrApi
    });

    // 1. Flightradar24 provider
    const frResult = await enricher.enrichFlight({ flight: "DLH11", r: "D-FR24", lat: 53.68, lon: 10.15 });
    assert.equal(frResult.source, "flightradar24");

    // 2. CSV fallback provider
    const csvResult = await enricher.enrichFlight({ flight: "CSV01", r: "D-CSV1", t: "E190" });
    assert.equal(csvResult.source, "csv");
    assert.equal(csvResult.aircraft, "Embraer ERJ-190");

    // 3. Complete fallback
    const fallbackResult = await enricher.enrichFlight({ flight: "NONE01", r: "D-NONE" });
    assert.equal(fallbackResult.source, "fallback");
  });
});
