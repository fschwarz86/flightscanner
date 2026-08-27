const mqtt = require("mqtt");
const { formatNotificationPayload } = require("./formatter");
const { logger } = require("../../utils/logger");

function createMqttPublisher(options = {}) {
  const config = options.config || {};
  const brokerUrl = config.mqtt?.brokerUrl || "mqtt://localhost:1883";
  const topic = config.mqtt?.topic || "awtrix/cmd/notify";
  const mqttOptions = {
    clientId: config.mqtt?.clientId || `flightscanner_${Math.random().toString(16).slice(2, 8)}`,
    reconnectPeriod: 5000,
    connectTimeout: 10000
  };

  if (config.mqtt?.username) mqttOptions.username = config.mqtt.username;
  if (config.mqtt?.password) mqttOptions.password = config.mqtt.password;

  let client = options.mockClient || null;
  let isConnected = false;

  function connect() {
    if (client) return;

    logger.info(`Connecting to MQTT broker at ${brokerUrl} (client ID: ${mqttOptions.clientId})`);
    client = mqtt.connect(brokerUrl, mqttOptions);

    client.on("connect", () => {
      isConnected = true;
      logger.info(`MQTT Client connected successfully to ${brokerUrl}`);
    });

    client.on("reconnect", () => {
      logger.warn("MQTT Client attempting reconnect...");
    });

    client.on("offline", () => {
      isConnected = false;
      logger.warn("MQTT Client is offline");
    });

    client.on("error", (err) => {
      logger.error(`MQTT Client connection error: ${err.message}`);
    });
  }

  async function publishNotification(flightData, payloadOptions = {}) {
    const payload = formatNotificationPayload(flightData, payloadOptions);
    const messageStr = JSON.stringify(payload);

    logger.info(`[NOTIFY] ${payload.text} (Icon: ${payload.icon})`);

    return new Promise((resolve) => {
      if (!client) {
        logger.warn("Cannot publish notification: MQTT client not initialized");
        return resolve(false);
      }

      client.publish(topic, messageStr, { qos: 0, retain: false }, (err) => {
        if (err) {
          logger.error(`Failed to publish notification to ${topic}: ${err.message}`);
          resolve(false);
        } else {
          logger.debug(`Published notification to topic ${topic}`);
          resolve(true);
        }
      });
    });
  }

  function close() {
    if (client) {
      client.end(true);
      client = null;
      isConnected = false;
      logger.info("MQTT Client closed");
    }
  }

  return {
    connect,
    publishNotification,
    close,
    isConnected: () => isConnected
  };
}

module.exports = {
  createMqttPublisher
};
