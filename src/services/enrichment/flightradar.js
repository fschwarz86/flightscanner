const { FlightRadar24API } = require("flightradarapi");
const { logger } = require("../../utils/logger");

let frApiInstance = null;

function getApiInstance() {
  if (!frApiInstance) {
    frApiInstance = new FlightRadar24API();
  }
  return frApiInstance;
}

/**
 * Fetch flight details from Flightradar24.
 * @param {Object} telemetry - Aircraft telemetry { callsign, registration, hex, lat, lon }
 * @param {Object} options - Options { timeoutMs, apiInstance }
 * @returns {Promise<Object|null>} Normalized flight details or null
 */
async function fetchFlightradarData(telemetry, options = {}) {
  const api = options.apiInstance || getApiInstance();
  const rawCallsign = (telemetry.flight || telemetry.callsign || "").trim();
  const rawRegistration = (telemetry.r || telemetry.registration || "").trim();
  const lat = telemetry.lat;
  const lon = telemetry.lon;

  try {
    let matchedFlight = null;

    // 1. Try finding by registration if available
    if (rawRegistration) {
      try {
        const regFlights = await api.getFlights(null, null, rawRegistration);
        if (Array.isArray(regFlights) && regFlights.length > 0) {
          matchedFlight = regFlights[0];
        }
      } catch (err) {
        logger.debug(`Flightradar registration lookup error for ${rawRegistration}: ${err.message}`);
      }
    }

    // 2. If not found by registration and coordinates are available, check local bounds
    if (!matchedFlight && lat !== undefined && lon !== undefined && !isNaN(lat) && !isNaN(lon)) {
      try {
        const bounds = api.getBoundsByPoint(lat, lon, 30000); // 30km radius
        const areaFlights = await api.getFlights(null, bounds);
        if (Array.isArray(areaFlights)) {
          matchedFlight = areaFlights.find(f => {
            if (rawCallsign && f.callsign && f.callsign.trim().toUpperCase() === rawCallsign.toUpperCase()) return true;
            if (rawRegistration && f.registration && f.registration.trim().toUpperCase() === rawRegistration.toUpperCase()) return true;
            if (telemetry.hex && f.icao24bit && f.icao24bit.trim().toLowerCase() === telemetry.hex.trim().toLowerCase()) return true;
            return false;
          });
        }
      } catch (err) {
        logger.debug(`Flightradar bounds lookup error near ${lat},${lon}: ${err.message}`);
      }
    }

    if (!matchedFlight) {
      logger.debug(`Flightradar found no match for callsign: "${rawCallsign}", reg: "${rawRegistration}"`);
      return null;
    }

    // Fetch full flight details for rich route & aircraft metadata
    let details = null;
    try {
      details = await api.getFlightDetails(matchedFlight);
    } catch (err) {
      logger.debug(`Flightradar getFlightDetails error for flight ${matchedFlight.id}: ${err.message}`);
    }

    const airlineName = details?.airline?.name || matchedFlight.airlineIcao || "";
    const origin = details?.airport?.origin?.code?.iata || details?.airport?.origin?.name || matchedFlight.originAirportIata || "";
    const destination = details?.airport?.destination?.code?.iata || details?.airport?.destination?.name || matchedFlight.destinationAirportIata || "";
    const aircraftModel = details?.aircraft?.model?.text || matchedFlight.aircraftCode || "";
    const aircraftIcao = details?.aircraft?.model?.code || matchedFlight.aircraftCode || "";
    const flightNumberIata = details?.identification?.number?.default || matchedFlight.flightNumber || matchedFlight.number || "";

    return {
      callsign: rawCallsign || matchedFlight.callsign || "",
      flightNumberIata: flightNumberIata || "",
      airline: airlineName,
      origin: origin,
      destination: destination,
      aircraft: aircraftModel,
      aircraftIcao: aircraftIcao,
      registration: rawRegistration || matchedFlight.registration || "",
      source: "flightradar24"
    };
  } catch (err) {
    logger.debug(`Flightradar enrichment unexpected error: ${err.message}`);
    return null;
  }
}

module.exports = {
  fetchFlightradarData,
  getApiInstance
};
