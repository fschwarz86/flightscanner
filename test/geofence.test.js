const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { isAircraftInGeofence } = require("../src/services/tracking/geofence");

describe("Geofence Module", () => {
  const geofence = { minLat: 53.65, maxLat: 53.72, minLon: 10.10, maxLon: 10.20 };
  const altitude = { minFt: 2000, maxFt: 10000 };

  it("should return true for aircraft inside coordinate and altitude boundaries", () => {
    const aircraft = {
      flight: "DLH123",
      lat: 53.68,
      lon: 10.15,
      alt_baro: 5000
    };
    assert.equal(isAircraftInGeofence(aircraft, geofence, altitude), true);
  });

  it("should return false for aircraft outside latitude bounds", () => {
    const aircraftTooNorth = { flight: "F1", lat: 53.75, lon: 10.15, alt_baro: 5000 };
    const aircraftTooSouth = { flight: "F2", lat: 53.60, lon: 10.15, alt_baro: 5000 };
    assert.equal(isAircraftInGeofence(aircraftTooNorth, geofence, altitude), false);
    assert.equal(isAircraftInGeofence(aircraftTooSouth, geofence, altitude), false);
  });

  it("should return false for aircraft outside longitude bounds", () => {
    const aircraftTooWest = { flight: "F3", lat: 53.68, lon: 10.05, alt_baro: 5000 };
    const aircraftTooEast = { flight: "F4", lat: 53.68, lon: 10.25, alt_baro: 5000 };
    assert.equal(isAircraftInGeofence(aircraftTooWest, geofence, altitude), false);
    assert.equal(isAircraftInGeofence(aircraftTooEast, geofence, altitude), false);
  });

  it("should return false for aircraft outside altitude bounds", () => {
    const aircraftTooLow = { flight: "F5", lat: 53.68, lon: 10.15, alt_baro: 1500 };
    const aircraftTooHigh = { flight: "F6", lat: 53.68, lon: 10.15, alt_baro: 12000 };
    assert.equal(isAircraftInGeofence(aircraftTooLow, geofence, altitude), false);
    assert.equal(isAircraftInGeofence(aircraftTooHigh, geofence, altitude), false);
  });

  it("should check fallback altitude fields (alt_geom and altitude)", () => {
    const geomAircraft = { flight: "F7", lat: 53.68, lon: 10.15, alt_geom: 6000 };
    const altAircraft = { flight: "F8", lat: 53.68, lon: 10.15, altitude: 7000 };
    assert.equal(isAircraftInGeofence(geomAircraft, geofence, altitude), true);
    assert.equal(isAircraftInGeofence(altAircraft, geofence, altitude), true);
  });

  it("should handle ground status altitude string", () => {
    const groundAircraft = { flight: "F9", lat: 53.68, lon: 10.15, alt_baro: "ground" };
    assert.equal(isAircraftInGeofence(groundAircraft, geofence, altitude), false);
  });

  it("should safely return false for missing or null telemetry values", () => {
    assert.equal(isAircraftInGeofence(null, geofence, altitude), false);
    assert.equal(isAircraftInGeofence({}, geofence, altitude), false);
    assert.equal(isAircraftInGeofence({ lat: 53.68 }, geofence, altitude), false);
    assert.equal(isAircraftInGeofence({ lat: 53.68, lon: 10.15 }, geofence, altitude), false);
  });
});
