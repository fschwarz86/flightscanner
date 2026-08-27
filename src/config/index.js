const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { defaultConfig } = require("./defaults");
const { logger } = require("../utils/logger");

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function parseEnvFile(content) {
  const result = {};
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      result[key] = val;
    }
  }
  return result;
}

function loadConfig(customConfigPath = null) {
  // Always load .env if present in current working directory
  const localEnvPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(localEnvPath)) {
    dotenv.config({ path: localEnvPath });
  }

  const config = deepClone(defaultConfig);
  let loadedFrom = "defaults";

  const candidatePaths = [];
  if (customConfigPath) {
    candidatePaths.push({ path: customConfigPath, type: "custom" });
  } else if (process.env.CONFIG_FILE) {
    candidatePaths.push({ path: process.env.CONFIG_FILE, type: "env_var" });
  }
  candidatePaths.push({ path: "/etc/flightscanner/config.json", type: "system_json" });
  candidatePaths.push({ path: "/etc/default/flightscanner", type: "system_env" });

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate.path)) {
      try {
        const rawContent = fs.readFileSync(candidate.path, "utf8");
        if (candidate.path.endsWith(".json")) {
          const parsed = JSON.parse(rawContent);
          mergeObjects(config, parsed);
          loadedFrom = candidate.path;
          break;
        } else {
          const parsedEnv = parseEnvFile(rawContent);
          applyEnvMapToConfig(config, parsedEnv);
          loadedFrom = candidate.path;
          break;
        }
      } catch (err) {
        logger.warn(`Failed to parse config file at ${candidate.path}: ${err.message}`);
      }
    }
  }

  // Overlay process.env overrides
  applyEnvMapToConfig(config, process.env);

  // Sync logger level
  if (config.logLevel) {
    logger.setLevel(config.logLevel);
  }

  logger.debug(`Configuration loaded (source: ${loadedFrom})`);
  return config;
}

function mergeObjects(target, source) {
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] !== null &&
      typeof target[key] === "object"
    ) {
      mergeObjects(target[key], source[key]);
    } else if (source[key] !== undefined) {
      target[key] = source[key];
    }
  }
}

function applyEnvMapToConfig(config, env) {
  if (env.DUMP1090_FILE_PATH) config.dump1090FilePath = env.DUMP1090_FILE_PATH;
  if (env.AIRCRAFT_TYPES_CSV_PATH) config.aircraftTypesCsvPath = env.AIRCRAFT_TYPES_CSV_PATH;

  if (env.MQTT_BROKER_URL) config.mqtt.brokerUrl = env.MQTT_BROKER_URL;
  if (env.MQTT_USERNAME !== undefined && env.MQTT_USERNAME !== "") config.mqtt.username = env.MQTT_USERNAME;
  if (env.MQTT_PASSWORD !== undefined && env.MQTT_PASSWORD !== "") config.mqtt.password = env.MQTT_PASSWORD;
  if (env.MQTT_TOPIC) config.mqtt.topic = env.MQTT_TOPIC;
  if (env.MQTT_CLIENT_ID) config.mqtt.clientId = env.MQTT_CLIENT_ID;

  if (env.GEOFENCE_MIN_LAT !== undefined && env.GEOFENCE_MIN_LAT !== "") config.geofence.minLat = parseFloat(env.GEOFENCE_MIN_LAT);
  if (env.GEOFENCE_MAX_LAT !== undefined && env.GEOFENCE_MAX_LAT !== "") config.geofence.maxLat = parseFloat(env.GEOFENCE_MAX_LAT);
  if (env.GEOFENCE_MIN_LON !== undefined && env.GEOFENCE_MIN_LON !== "") config.geofence.minLon = parseFloat(env.GEOFENCE_MIN_LON);
  if (env.GEOFENCE_MAX_LON !== undefined && env.GEOFENCE_MAX_LON !== "") config.geofence.maxLon = parseFloat(env.GEOFENCE_MAX_LON);

  if (env.ALTITUDE_MIN_FT !== undefined && env.ALTITUDE_MIN_FT !== "") config.altitude.minFt = parseInt(env.ALTITUDE_MIN_FT, 10);
  if (env.ALTITUDE_MAX_FT !== undefined && env.ALTITUDE_MAX_FT !== "") config.altitude.maxFt = parseInt(env.ALTITUDE_MAX_FT, 10);

  if (env.FLIGHT_COOLDOWN_MS !== undefined && env.FLIGHT_COOLDOWN_MS !== "") config.cooldownMs = parseInt(env.FLIGHT_COOLDOWN_MS, 10);
  if (env.ROUTE_CACHE_TTL_MS !== undefined && env.ROUTE_CACHE_TTL_MS !== "") config.cacheTtlMs = parseInt(env.ROUTE_CACHE_TTL_MS, 10);
  if (env.LOG_LEVEL) config.logLevel = env.LOG_LEVEL;
}

function validateConfig(config) {
  if (!config) throw new Error("Configuration object is required");

  if (!config.dump1090FilePath || typeof config.dump1090FilePath !== "string") {
    throw new Error("Invalid dump1090FilePath: must be a non-empty string path");
  }

  if (!config.mqtt || !config.mqtt.brokerUrl || typeof config.mqtt.brokerUrl !== "string") {
    throw new Error("Invalid mqtt.brokerUrl: must be a non-empty URL string");
  }

  if (!config.geofence || typeof config.geofence !== "object") {
    throw new Error("Invalid geofence: must be an object with minLat, maxLat, minLon, maxLon");
  }

  const { minLat, maxLat, minLon, maxLon } = config.geofence;
  if (isNaN(minLat) || isNaN(maxLat) || minLat > maxLat || minLat < -90 || maxLat > 90) {
    throw new Error(`Invalid geofence latitudes: minLat (${minLat}) must be <= maxLat (${maxLat}) between -90 and 90`);
  }

  if (isNaN(minLon) || isNaN(maxLon) || minLon > maxLon || minLon < -180 || maxLon > 180) {
    throw new Error(`Invalid geofence longitudes: minLon (${minLon}) must be <= maxLon (${maxLon}) between -180 and 180`);
  }

  if (!config.altitude || typeof config.altitude !== "object") {
    throw new Error("Invalid altitude: must be an object with minFt and maxFt");
  }

  const { minFt, maxFt } = config.altitude;
  if (isNaN(minFt) || isNaN(maxFt) || minFt > maxFt || minFt < 0) {
    throw new Error(`Invalid altitude boundaries: minFt (${minFt}) must be <= maxFt (${maxFt}) and non-negative`);
  }

  if (isNaN(config.cooldownMs) || config.cooldownMs < 0) {
    throw new Error(`Invalid cooldownMs: (${config.cooldownMs}) must be a non-negative number`);
  }

  if (isNaN(config.cacheTtlMs) || config.cacheTtlMs < 0) {
    throw new Error(`Invalid cacheTtlMs: (${config.cacheTtlMs}) must be a non-negative number`);
  }

  return true;
}

module.exports = {
  loadConfig,
  validateConfig,
  defaultConfig
};
