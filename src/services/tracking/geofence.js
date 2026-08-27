/**
 * Checks whether an aircraft is within the configured geofence and altitude boundaries.
 * @param {Object} aircraft - Aircraft object from dump1090
 * @param {Object} geofence - { minLat, maxLat, minLon, maxLon }
 * @param {Object} altitude - { minFt, maxFt }
 * @returns {boolean}
 */
function isAircraftInGeofence(aircraft, geofence, altitude) {
  if (!aircraft || typeof aircraft !== "object") return false;
  if (!geofence || typeof geofence !== "object") return false;
  if (!altitude || typeof altitude !== "object") return false;

  const lat = aircraft.lat;
  const lon = aircraft.lon;

  if (lat === undefined || lat === null || isNaN(lat)) return false;
  if (lon === undefined || lon === null || isNaN(lon)) return false;

  if (lat < geofence.minLat || lat > geofence.maxLat) return false;
  if (lon < geofence.minLon || lon > geofence.maxLon) return false;

  // Extract altitude (support alt_baro, alt_geom, altitude)
  let rawAlt = aircraft.alt_baro;
  if (rawAlt === undefined || rawAlt === null) rawAlt = aircraft.alt_geom;
  if (rawAlt === undefined || rawAlt === null) rawAlt = aircraft.altitude;

  if (rawAlt === "ground") {
    rawAlt = 0;
  }

  const alt = typeof rawAlt === "number" ? rawAlt : parseFloat(rawAlt);
  if (isNaN(alt)) return false;

  if (alt < altitude.minFt || alt > altitude.maxFt) return false;

  return true;
}

module.exports = {
  isAircraftInGeofence
};
