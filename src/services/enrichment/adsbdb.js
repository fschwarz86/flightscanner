const axios = require("axios");
const { logger } = require("../../utils/logger");

/**
 * Fetch flight route and aircraft details from adsbdb.com.
 * @param {Object} telemetry - Aircraft telemetry { callsign, registration }
 * @param {Object} options - Options { timeoutMs, baseUrl }
 * @returns {Promise<Object|null>} Normalized flight details or null
 */
async function fetchAdsbdbData(telemetry, options = {}) {
  const callsign = (telemetry.flight || telemetry.callsign || "").trim();
  const registration = (telemetry.r || telemetry.registration || "").trim();
  const timeoutMs = options.timeoutMs || 4000;
  const baseUrl = options.baseUrl || "https://api.adsbdb.com/v0";

  if (!registration && !callsign) {
    return null;
  }

  try {
    let url = `${baseUrl}/aircraft/${encodeURIComponent(registration)}`;
    if (callsign) {
      url += `?callsign=${encodeURIComponent(callsign)}`;
    }

    const response = await axios.get(url, {
      timeout: timeoutMs,
      headers: {
        "Accept": "application/json",
        "User-Agent": "flightscanner/1.0"
      }
    });

    const data = response.data?.response;
    if (!data) return null;

    const aircraftData = data.aircraft || {};
    const routeData = data.flightroute || {};

    const airline = aircraftData.registered_owner || routeData.airline?.name || "";
    const origin = routeData.origin?.iata_code || routeData.origin?.municipality || routeData.origin?.name || "";
    const destination = routeData.destination?.iata_code || routeData.destination?.municipality || routeData.destination?.name || "";
    const aircraftModel = aircraftData.type || aircraftData.model || "";
    const aircraftIcao = aircraftData.icao_type_code || "";

    return {
      callsign: callsign || routeData.callsign || "",
      airline: airline,
      origin: origin,
      destination: destination,
      aircraft: aircraftModel,
      aircraftIcao: aircraftIcao,
      registration: registration || aircraftData.registration || "",
      source: "adsbdb"
    };
  } catch (err) {
    if (err.response && err.response.status === 404) {
      logger.debug(`adsbdb: Flight/registration not found (404) for reg=${registration}, callsign=${callsign}`);
    } else {
      logger.debug(`adsbdb error: ${err.message}`);
    }
    return null;
  }
}

module.exports = {
  fetchAdsbdbData
};
