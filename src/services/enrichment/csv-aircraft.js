const fs = require("fs");
const Papa = require("papaparse");
const { logger } = require("../../utils/logger");

let aircraftTypeMap = new Map();
let isLoaded = false;

/**
 * Load and index ICAO aircraft types from CSV.
 * @param {string} csvPath - Path to aircraft_types.csv
 * @returns {Promise<Map<string, string>>}
 */
async function loadAircraftTypes(csvPath) {
  if (!csvPath || !fs.existsSync(csvPath)) {
    logger.debug(`Aircraft types CSV not found at ${csvPath}, skipping local lookup`);
    aircraftTypeMap = new Map();
    isLoaded = true;
    return aircraftTypeMap;
  }

  return new Promise((resolve) => {
    const fileStream = fs.createReadStream(csvPath);
    const newMap = new Map();

    Papa.parse(fileStream, {
      header: true,
      skipEmptyLines: true,
      step: function (results) {
        const row = results.data;
        const icao = row["Designator"] || row["designator"] || row["ICAO"] || row["icao"];
        const model = row["Model"] || row["model"] || row["Description"] || row["description"];
        const manufacturer = row["Manufacturer"] || row["manufacturer"] || "";

        if (icao && model) {
          const fullName = manufacturer ? `${manufacturer} ${model}`.trim() : model.trim();
          newMap.set(icao.trim().toUpperCase(), fullName);
        }
      },
      complete: function () {
        aircraftTypeMap = newMap;
        isLoaded = true;
        logger.debug(`Loaded ${aircraftTypeMap.size} aircraft types from CSV`);
        resolve(aircraftTypeMap);
      },
      error: function (err) {
        logger.warn(`Error parsing aircraft types CSV: ${err.message}`);
        aircraftTypeMap = newMap;
        isLoaded = true;
        resolve(aircraftTypeMap);
      }
    });
  });
}

/**
 * Lookup aircraft model description by ICAO code.
 * @param {string} icaoCode - ICAO aircraft code (e.g. "A320", "B738")
 * @returns {string|null}
 */
function lookupAircraftType(icaoCode) {
  if (!icaoCode || typeof icaoCode !== "string") return null;
  return aircraftTypeMap.get(icaoCode.trim().toUpperCase()) || null;
}

function clearAircraftTypes() {
  aircraftTypeMap.clear();
  isLoaded = false;
}

module.exports = {
  loadAircraftTypes,
  lookupAircraftType,
  clearAircraftTypes
};
