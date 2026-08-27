const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createMqttPublisher } = require("../src/services/notification/mqtt");

describe("MQTT Publisher Module", () => {
  it("should serialize payload and publish to target topic", async () => {
    let publishedTopic = null;
    let publishedPayload = null;
    let publishedOpts = null;

    const mockClient = {
      publish: (topic, message, opts, cb) => {
        publishedTopic = topic;
        publishedPayload = JSON.parse(message);
        publishedOpts = opts;
        cb(null);
      },
      end: (force) => {}
    };

    const config = {
      mqtt: {
        brokerUrl: "mqtt://homeassistant:1883",
        topic: "awtrix/cmd/notify",
        clientId: "flightscanner_test"
      }
    };

    const publisher = createMqttPublisher({ config, mockClient });
    const flight = {
      airline: "Lufthansa",
      callsign: "DLH123",
      origin: "MUC",
      destination: "HAM",
      aircraft: "Airbus A320"
    };

    const success = await publisher.publishNotification(flight);
    assert.equal(success, true);
    assert.equal(publishedTopic, "awtrix/cmd/notify");
    assert.equal(publishedPayload.icon, "24591");
    assert.equal(publishedOpts.qos, 0);
  });

  it("should close client cleanly", () => {
    let closed = false;
    const mockClient = {
      publish: () => {},
      end: () => { closed = true; }
    };

    const publisher = createMqttPublisher({ config: {}, mockClient });
    publisher.close();
    assert.equal(closed, true);
  });
});
