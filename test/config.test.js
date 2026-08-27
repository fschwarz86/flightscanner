const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { loadConfig, validateConfig, defaultConfig } = require("../src/config");

describe("Config Module", () => {
  const originalEnv = { ...process.env };
  let tempDir;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.DUMP1090_FILE_PATH;
    delete process.env.AIRCRAFT_TYPES_CSV_PATH;
    delete process.env.MQTT_BROKER_URL;
    delete process.env.MQTT_USERNAME;
    delete process.env.MQTT_PASSWORD;
    delete process.env.MQTT_TOPIC;
    delete process.env.MQTT_CLIENT_ID;
    delete process.env.GEOFENCE_MIN_LAT;
    delete process.env.GEOFENCE_MAX_LAT;
    delete process.env.GEOFENCE_MIN_LON;
    delete process.env.GEOFENCE_MAX_LON;
    delete process.env.ALTITUDE_MIN_FT;
    delete process.env.ALTITUDE_MAX_FT;
    delete process.env.FLIGHT_COOLDOWN_MS;
    delete process.env.ROUTE_CACHE_TTL_MS;
    delete process.env.LOG_LEVEL;
    delete process.env.CONFIG_FILE;

    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "flightscanner-test-"));
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("loadConfig", () => {
    it("should load default configuration when no file or env vars are present", () => {
      const config = loadConfig("/nonexistent/file.json");
      assert.equal(config.dump1090FilePath, defaultConfig.dump1090FilePath);
      assert.equal(config.mqtt.brokerUrl, defaultConfig.mqtt.brokerUrl);
      assert.equal(config.geofence.minLat, 53.65);
      assert.equal(config.geofence.maxLat, 53.72);
      assert.equal(config.altitude.minFt, 2000);
      assert.equal(config.altitude.maxFt, 10000);
    });

    it("should merge JSON configuration from custom path", () => {
      const jsonConfigPath = path.join(tempDir, "config.json");
      const customConfig = {
        dump1090FilePath: "/tmp/custom-aircraft.json",
        mqtt: {
          brokerUrl: "mqtt://192.168.1.50:1883",
          topic: "custom/topic"
        },
        geofence: {
          minLat: 50.0,
          maxLat: 51.0
        }
      };
      fs.writeFileSync(jsonConfigPath, JSON.stringify(customConfig), "utf8");

      const config = loadConfig(jsonConfigPath);
      assert.equal(config.dump1090FilePath, "/tmp/custom-aircraft.json");
      assert.equal(config.mqtt.brokerUrl, "mqtt://192.168.1.50:1883");
      assert.equal(config.mqtt.topic, "custom/topic");
      assert.equal(config.mqtt.clientId, "flightscanner"); // preserved from default
      assert.equal(config.geofence.minLat, 50.0);
      assert.equal(config.geofence.maxLat, 51.0);
      assert.equal(config.geofence.minLon, 10.10); // preserved from default
    });

    it("should merge KEY=VALUE env file format", () => {
      const envConfigPath = path.join(tempDir, "default-flightscanner");
      const customEnv = `
# Comments should be ignored
MQTT_BROKER_URL=mqtt://mosquitto.local:1883
GEOFENCE_MIN_LAT=52.123
ALTITUDE_MAX_FT=15000
`;
      fs.writeFileSync(envConfigPath, customEnv, "utf8");

      const config = loadConfig(envConfigPath);
      assert.equal(config.mqtt.brokerUrl, "mqtt://mosquitto.local:1883");
      assert.equal(config.geofence.minLat, 52.123);
      assert.equal(config.altitude.maxFt, 15000);
    });

    it("should prioritize process.env variables over file configuration", () => {
      const jsonConfigPath = path.join(tempDir, "config.json");
      fs.writeFileSync(jsonConfigPath, JSON.stringify({
        mqtt: { brokerUrl: "mqtt://from-file:1883" }
      }), "utf8");

      process.env.MQTT_BROKER_URL = "mqtt://from-env:1883";
      process.env.GEOFENCE_MIN_LAT = "54.10";
      process.env.ALTITUDE_MIN_FT = "3500";

      const config = loadConfig(jsonConfigPath);
      assert.equal(config.mqtt.brokerUrl, "mqtt://from-env:1883");
      assert.equal(config.geofence.minLat, 54.10);
      assert.equal(config.altitude.minFt, 3500);
    });
  });

  describe("validateConfig", () => {
    it("should pass for valid configuration", () => {
      const config = { ...defaultConfig };
      assert.equal(validateConfig(config), true);
    });

    it("should throw when dump1090FilePath is missing or empty", () => {
      const config = { ...defaultConfig, dump1090FilePath: "" };
      assert.throws(() => validateConfig(config), /Invalid dump1090FilePath/);
    });

    it("should throw when mqtt.brokerUrl is missing or empty", () => {
      const config = { ...defaultConfig, mqtt: { ...defaultConfig.mqtt, brokerUrl: "" } };
      assert.throws(() => validateConfig(config), /Invalid mqtt.brokerUrl/);
    });

    it("should throw when geofence bounds are inverted or invalid", () => {
      const invalidLat = {
        ...defaultConfig,
        geofence: { minLat: 60.0, maxLat: 50.0, minLon: 10.0, maxLon: 11.0 }
      };
      assert.throws(() => validateConfig(invalidLat), /Invalid geofence latitudes/);

      const invalidLon = {
        ...defaultConfig,
        geofence: { minLat: 50.0, maxLat: 60.0, minLon: 200.0, maxLon: 11.0 }
      };
      assert.throws(() => validateConfig(invalidLon), /Invalid geofence longitudes/);
    });

    it("should throw when altitude boundaries are inverted or negative", () => {
      const invalidAlt = {
        ...defaultConfig,
        altitude: { minFt: 10000, maxFt: 2000 }
      };
      assert.throws(() => validateConfig(invalidAlt), /Invalid altitude boundaries/);
    });

    it("should throw when timers are negative numbers", () => {
      const invalidCooldown = { ...defaultConfig, cooldownMs: -100 };
      assert.throws(() => validateConfig(invalidCooldown), /Invalid cooldownMs/);

      const invalidCache = { ...defaultConfig, cacheTtlMs: -50 };
      assert.throws(() => validateConfig(invalidCache), /Invalid cacheTtlMs/);
    });
  });
});
