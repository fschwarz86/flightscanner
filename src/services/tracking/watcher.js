const fs = require("fs");
const chokidar = require("chokidar");
const { isAircraftInGeofence } = require("./geofence");
const { logger } = require("../../utils/logger");

function createTelemetryWatcher(options = {}) {
  const config = options.config || {};
  const onAircraftDetected = options.onAircraftDetected || null;
  const filePath = config.dump1090FilePath;
  let watcher = null;
  let isReading = false;

  async function handleFileChange(changedPath) {
    if (isReading) return;
    isReading = true;

    try {
      if (!fs.existsSync(changedPath)) {
        isReading = false;
        return;
      }

      const fileData = await fs.promises.readFile(changedPath, "utf8");
      if (!fileData || !fileData.trim()) {
        isReading = false;
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(fileData);
      } catch (jsonErr) {
        // Atomic file rewrite might be half-written, safely ignore and wait for next tick
        logger.debug(`dump1090 file partial write JSON parse warning: ${jsonErr.message}`);
        isReading = false;
        return;
      }

      const aircraftList = Array.isArray(parsed.aircraft) ? parsed.aircraft : [];
      for (const aircraft of aircraftList) {
        if (isAircraftInGeofence(aircraft, config.geofence, config.altitude)) {
          if (typeof onAircraftDetected === "function") {
            onAircraftDetected(aircraft);
          }
        }
      }
    } catch (err) {
      logger.warn(`Error reading dump1090 telemetry file: ${err.message}`);
    } finally {
      isReading = false;
    }
  }

  function start() {
    if (watcher) return;
    logger.info(`Starting dump1090 file watcher on: ${filePath}`);

    watcher = chokidar.watch(filePath, {
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 150,
        pollInterval: 50
      }
    });

    watcher.on("add", handleFileChange);
    watcher.on("change", handleFileChange);
    watcher.on("error", (err) => {
      logger.error(`Watcher error on ${filePath}: ${err.message}`);
    });
  }

  async function stop() {
    if (watcher) {
      await watcher.close();
      watcher = null;
      logger.info("Stopped dump1090 file watcher");
    }
  }

  return {
    start,
    stop,
    handleFileChange
  };
}

module.exports = {
  createTelemetryWatcher
};
