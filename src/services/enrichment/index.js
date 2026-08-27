const { fetchFlightradarData } = require("./flightradar");
const { fetchAdsbdbData } = require("./adsbdb");
const { loadAircraftTypes, lookupAircraftType, clearAircraftTypes } = require("./csv-aircraft");
const { logger } = require("../../utils/logger");

function createEnricher(options = {}) {
  const config = options.config || {};
  const cache = options.cache || null;
  const frApiInstance = options.frApiInstance || null;

  async function init() {
    if (config.aircraftTypesCsvPath) {
      await loadAircraftTypes(config.aircraftTypesCsvPath);
    }
  }

  async function enrichFlight(telemetry) {
    if (!telemetry || typeof telemetry !== "object") {
      return null;
    }

    const callsign = (telemetry.flight || telemetry.callsign || "").trim();
    const registration = (telemetry.r || telemetry.registration || "").trim();
    const hex = (telemetry.hex || "").trim();
    const cacheKey = callsign || registration || hex;

    // 1. Check cache
    if (cache && cacheKey) {
      const cached = cache.get(cacheKey);
      if (cached) {
        logger.debug(`[ENRICH] Cache hit for flight ${cacheKey} (provider: cache [original: ${cached.source || "unknown"}])`);
        return cached;
      }
    }

    let enriched = null;
    let usedProvider = "fallback";

    // 2. Try primary Flightradar24 provider
    try {
      enriched = await fetchFlightradarData(telemetry, { apiInstance: frApiInstance });
      if (enriched) {
        usedProvider = "flightradar24";
        logger.debug(`[ENRICH] Flightradar24 resolved flight ${cacheKey}: airline="${enriched.airline}", route="${enriched.origin}" -> "${enriched.destination}", model="${enriched.aircraft}"`);
      }
    } catch (err) {
      logger.debug(`Primary Flightradar24 enrichment failed: ${err.message}`);
    }

    // 3. Fallback to adsbdb if Flightradar returned null or lacked route info
    if (!enriched || (!enriched.origin && !enriched.destination)) {
      try {
        const adsbdbResult = await fetchAdsbdbData(telemetry);
        if (adsbdbResult) {
          if (!enriched) {
            enriched = adsbdbResult;
            usedProvider = "adsbdb";
            logger.debug(`[ENRICH] adsbdb resolved flight ${cacheKey}: airline="${enriched.airline}", route="${enriched.origin}" -> "${enriched.destination}", model="${enriched.aircraft}"`);
          } else {
            // Merge adsbdb route details into existing enriched data
            if (!enriched.origin && adsbdbResult.origin) enriched.origin = adsbdbResult.origin;
            if (!enriched.destination && adsbdbResult.destination) enriched.destination = adsbdbResult.destination;
            if (!enriched.airline && adsbdbResult.airline) enriched.airline = adsbdbResult.airline;
            if (!enriched.aircraft && adsbdbResult.aircraft) enriched.aircraft = adsbdbResult.aircraft;
            usedProvider = "flightradar24+adsbdb";
            logger.debug(`[ENRICH] Merged adsbdb route info for flight ${cacheKey}`);
          }
        }
      } catch (err) {
        logger.debug(`Secondary adsbdb enrichment failed: ${err.message}`);
      }
    }

    // 4. Resolve aircraft type from local CSV if missing or code-only
    const rawIcao = telemetry.t || telemetry.aircraftIcao || enriched?.aircraftIcao || "";
    if (rawIcao) {
      const csvModel = lookupAircraftType(rawIcao);
      if (csvModel && (!enriched || !enriched.aircraft || enriched.aircraft === rawIcao)) {
        if (!enriched) {
          enriched = {
            callsign: callsign,
            airline: "",
            origin: "",
            destination: "",
            aircraft: csvModel,
            aircraftIcao: rawIcao,
            registration: registration,
            source: "csv"
          };
          usedProvider = "csv";
        } else {
          enriched.aircraft = csvModel;
          usedProvider = `${usedProvider}+csv`;
        }
        logger.debug(`[ENRICH] Resolved ICAO aircraft designator "${rawIcao}" -> "${csvModel}" via local CSV`);
      }
    }

    // 5. Final fallback object if all lookups failed
    const finalFlight = {
      callsign: enriched?.callsign || callsign || "Unbekannt",
      airline: enriched?.airline || "Unbekannte Fluggesellschaft",
      origin: enriched?.origin || "Unbekannt",
      destination: enriched?.destination || "Unbekannt",
      aircraft: enriched?.aircraft || (rawIcao ? `Flugzeug (${rawIcao})` : "Unbekannt"),
      aircraftIcao: enriched?.aircraftIcao || rawIcao || "",
      registration: enriched?.registration || registration || hex || "",
      source: enriched?.source || usedProvider
    };

    logger.debug(`[ENRICH] Flight ${cacheKey || "unknown"} finalized using provider: "${finalFlight.source}" (airline: "${finalFlight.airline}", route: "${finalFlight.origin}" -> "${finalFlight.destination}", aircraft: "${finalFlight.aircraft}")`);

    // 6. Cache result
    if (cache && cacheKey) {
      cache.set(cacheKey, finalFlight, config.cacheTtlMs);
    }

    return finalFlight;
  }

  return {
    init,
    enrichFlight
  };
}

module.exports = {
  createEnricher,
  fetchFlightradarData,
  fetchAdsbdbData,
  loadAircraftTypes,
  lookupAircraftType,
  clearAircraftTypes
};
