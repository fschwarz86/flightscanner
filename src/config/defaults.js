const defaultConfig = {
  dump1090FilePath: "/run/dump1090-fa/aircraft.json",
  aircraftTypesCsvPath: "/etc/flightdata/aircraft_types.csv",
  mqtt: {
    brokerUrl: "mqtt://homeassistant:1883",
    username: "",
    password: "",
    topic: "awtrix/cmd/notify",
    clientId: "flightscanner"
  },
  geofence: {
    minLat: 53.65,
    maxLat: 53.72,
    minLon: 10.10,
    maxLon: 10.20
  },
  altitude: {
    minFt: 2000,
    maxFt: 10000
  },
  cooldownMs: 900000,     // 15 minutes
  cacheTtlMs: 14400000,   // 4 hours
  logLevel: "info"
};

module.exports = {
  defaultConfig
};
