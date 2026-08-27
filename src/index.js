const { loadConfig, validateConfig } = require("./config");
const { logger } = require("./utils/logger");
const { FlightCache } = require("./services/enrichment/cache");
const { createEnricher } = require("./services/enrichment");
const { FlightQueue } = require("./services/tracking/queue");
const { createTelemetryWatcher } = require("./services/tracking/watcher");
const { createMqttPublisher } = require("./services/notification/mqtt");

/**
 * Initializes and starts the flightscanner application.
 * @param {Object} options - Optional overrides for testing (configPath, mockClient, frApiInstance)
 * @returns {Promise<Object>} Application controller with stop() method
 */
async function startApp(options = {}) {
  const config = loadConfig(options.configPath);
  validateConfig(config);

  logger.info("Initializing Flightscanner service...");

  // 1. Initialize Route Cache
  const cache = options.cache || new FlightCache({
    defaultTtlMs: config.cacheTtlMs
  });

  // 2. Initialize Enrichment Pipeline
  const enricher = options.enricher || createEnricher({
    config,
    cache,
    frApiInstance: options.frApiInstance
  });
  await enricher.init();

  // 3. Initialize MQTT Publisher
  const publisher = options.publisher || createMqttPublisher({
    config,
    mockClient: options.mockMqttClient
  });
  publisher.connect();

  // 4. Initialize Multi-Aircraft Processing Queue
  const queue = options.queue || new FlightQueue({
    cooldownMs: config.cooldownMs,
    delayBetweenFlightsMs: options.delayBetweenFlightsMs !== undefined ? options.delayBetweenFlightsMs : 15000,
    processCallback: async (aircraft) => {
      try {
        const enriched = await enricher.enrichFlight(aircraft);
        if (enriched) {
          await publisher.publishNotification(enriched);
        }
      } catch (err) {
        logger.error(`Failed to enrich and notify for flight: ${err.message}`);
      }
    }
  });

  // 5. Initialize Telemetry Watcher
  const watcher = options.watcher || createTelemetryWatcher({
    config,
    onAircraftDetected: (aircraft) => {
      queue.enqueue(aircraft);
    }
  });
  watcher.start();

  logger.info("Flightscanner service is running and monitoring airspace.");

  let isStopped = false;

  async function stop() {
    if (isStopped) return;
    isStopped = true;
    logger.info("Stopping Flightscanner service...");

    await watcher.stop();
    queue.clear();
    publisher.close();
    logger.info("Flightscanner service stopped cleanly.");
  }

  return {
    config,
    cache,
    enricher,
    publisher,
    queue,
    watcher,
    stop
  };
}

// Attach graceful shutdown hooks when executed directly as main script
if (require.main === module) {
  let appInstance = null;

  async function handleShutdown(signal) {
    logger.info(`Received ${signal}, initiating graceful shutdown...`);
    if (appInstance) {
      await appInstance.stop();
    }
    process.exit(0);
  }

  process.on("SIGINT", () => handleShutdown("SIGINT"));
  process.on("SIGTERM", () => handleShutdown("SIGTERM"));

  process.on("uncaughtException", (err) => {
    logger.error(`Uncaught exception: ${err.message}\n${err.stack}`);
  });

  process.on("unhandledRejection", (reason) => {
    logger.error(`Unhandled promise rejection: ${reason}`);
  });

  startApp()
    .then((app) => {
      appInstance = app;
    })
    .catch((err) => {
      logger.error(`Fatal startup error: ${err.message}`);
      process.exit(1);
    });
}

module.exports = {
  startApp
};
