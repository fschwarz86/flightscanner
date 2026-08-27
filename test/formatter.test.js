const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  getAirlineIcon,
  formatNotificationText,
  formatNotificationPayload,
  DEFAULT_ICON
} = require("../src/services/notification/formatter");

describe("Formatter Module", () => {
  describe("getAirlineIcon", () => {
    it("should match icon by exact airline name", () => {
      assert.equal(getAirlineIcon({ airline: "Lufthansa" }), 24591);
      assert.equal(getAirlineIcon({ airline: "Eurowings" }), 58999);
      assert.equal(getAirlineIcon({ airline: "Air France" }), 52241);
    });

    it("should match icon by callsign prefix", () => {
      assert.equal(getAirlineIcon({ callsign: "DLH123" }), 24591);
      assert.equal(getAirlineIcon({ callsign: "EWG40P" }), 58999);
      assert.equal(getAirlineIcon({ callsign: "SWR26W" }), 24604);
      assert.equal(getAirlineIcon({ callsign: "KLM1780" }), 24528);
    });

    it("should match icon by 2-letter IATA flight code prefix", () => {
      assert.equal(getAirlineIcon({ flightNumberIata: "LH123" }), 24591);
      assert.equal(getAirlineIcon({ flightNumberIata: "EW40" }), 58999);
      assert.equal(getAirlineIcon({ flightNumberIata: "BA902" }), 24607);
      assert.equal(getAirlineIcon({ flightNumberIata: "AF1234" }), 52241);
    });

    it("should match icon from unified registry by full name, IATA, or ICAO code", () => {
      // Ryanair
      assert.equal(getAirlineIcon({ airline: "Ryanair" }), 24601);
      assert.equal(getAirlineIcon({ flightNumberIata: "FR1234" }), 24601);
      assert.equal(getAirlineIcon({ callsign: "RYR456" }), 24601);

      // easyJet
      assert.equal(getAirlineIcon({ airline: "easyJet" }), 24606);
      assert.equal(getAirlineIcon({ flightNumberIata: "U2881" }), 24606);
      assert.equal(getAirlineIcon({ callsign: "EZY881" }), 24606);

      // Condor
      assert.equal(getAirlineIcon({ airline: "Condor" }), 24600);
      assert.equal(getAirlineIcon({ flightNumberIata: "DE150" }), 24600);
      assert.equal(getAirlineIcon({ callsign: "CFG150" }), 24600);

      // Wizz Air
      assert.equal(getAirlineIcon({ airline: "Wizz Air" }), 24610);
      assert.equal(getAirlineIcon({ flightNumberIata: "W61234" }), 24610);
      assert.equal(getAirlineIcon({ callsign: "WZZ1234" }), 24610);
    });

    it("should match partial airline names from registry", () => {
      assert.equal(getAirlineIcon({ airline: "Lufthansa Cargo" }), 24591);
      assert.equal(getAirlineIcon({ airline: "Eurowings Europe" }), 58999);
      assert.equal(getAirlineIcon({ airline: "Swiss Global Air Lines" }), 24604);
    });

    it("should allow matching against a custom registry", () => {
      const customRegistry = [
        { icon: 99999, names: ["Custom Aero"], codes: ["CA", "CST"] }
      ];
      assert.equal(getAirlineIcon({ airline: "Custom Aero" }, customRegistry), 99999);
      assert.equal(getAirlineIcon({ flightNumberIata: "CA100" }, customRegistry), 99999);
    });

    it("should fallback to default icon for unknown airlines", () => {
      assert.equal(getAirlineIcon({ airline: "Unknown Jet", callsign: "N12345" }), DEFAULT_ICON);
      assert.equal(getAirlineIcon({}), DEFAULT_ICON);
    });
  });

  describe("formatNotificationText", () => {
    it("should format Hamburg arrival flight text", () => {
      const flight = {
        airline: "Lufthansa",
        callsign: "DLH123",
        origin: "MUC",
        destination: "Hamburg (HAM)",
        aircraft: "Airbus A320"
      };
      const text = formatNotificationText(flight);
      assert.equal(text, "Lufthansa Flug DLH123 (Airbus A320) MUC -> Hamburg (HAM)");
    });

    it("should prefer IATA flightcode if available over ICAO callsign", () => {
      const flight = {
        airline: "Lufthansa",
        flightNumberIata: "LH123",
        callsign: "DLH123",
        origin: "MUC",
        destination: "Hamburg (HAM)",
        aircraft: "Airbus A320"
      };
      const text = formatNotificationText(flight);
      assert.equal(text, "Lufthansa Flug LH123 (Airbus A320) MUC -> Hamburg (HAM)");
    });

    it("should format departure from Hamburg", () => {
      const flight = {
        airline: "Eurowings",
        flightNumberIata: "EW40",
        callsign: "EWG40P",
        origin: "HAM",
        destination: "ARN",
        aircraft: "Airbus A320"
      };
      const text = formatNotificationText(flight);
      assert.equal(text, "Eurowings Flug EW40 (Airbus A320) -> ARN");
    });

    it("should format flight when origin/destination are missing", () => {
      const flight = {
        airline: "Lufthansa",
        callsign: "DLH999",
        aircraft: "A320"
      };
      const text = formatNotificationText(flight);
      assert.equal(text, "Lufthansa Flug DLH999 (A320) im Anflug");
    });

    it("should format flight with aircraft type when no route or airline data is known", () => {
      const flightWithModel = {
        callsign: "PRIV01",
        aircraft: "Cessna 172 Skyhawk"
      };
      assert.equal(formatNotificationText(flightWithModel), "Flug PRIV01 (Cessna 172 Skyhawk)");

      const flightWithIcao = {
        callsign: "PRIV02",
        aircraftIcao: "PA28"
      };
      assert.equal(formatNotificationText(flightWithIcao), "Flug PRIV02 (PA28)");
    });

    it("should format fallback when no route, airline, or aircraft data is known", () => {
      const flight = {
        callsign: "TEST01"
      };
      const text = formatNotificationText(flight);
      assert.equal(text, "Flug TEST01 (keine Daten)");
    });
  });

  describe("formatNotificationPayload", () => {
    it("should construct valid Awtrix payload object", () => {
      const flight = {
        airline: "Lufthansa",
        callsign: "DLH123",
        origin: "MUC",
        destination: "HAM",
        aircraft: "Airbus A320"
      };
      const payload = formatNotificationPayload(flight);

      assert.equal(payload.icon, "24591");
      assert.equal(payload.repeat, 3);
      assert.equal(payload.scroll.speed, 50);
      assert.match(payload.text, /Lufthansa Flug DLH123/);
    });
  });
});
