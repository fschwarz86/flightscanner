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

  it("should format notifications using config.baseAirport", async () => {
    let publishedPayload = null;
    const mockClient = {
      publish: (topic, message, opts, cb) => {
        publishedPayload = JSON.parse(message);
        cb(null);
      },
      end: () => {}
    };

    const config = {
      baseAirport: "BER",
      mqtt: {
        brokerUrl: "mqtt://homeassistant:1883",
        topic: "awtrix/cmd/notify"
      }
    };

    const publisher = createMqttPublisher({ config, mockClient });
    const flight = {
      airline: "Lufthansa",
      callsign: "DLH123",
      origin: "MUC",
      destination: "BER",
      aircraft: "Airbus A320"
    };

    const success = await publisher.publishNotification(flight);
    assert.equal(success, true);
    assert.match(publishedPayload.text, /<- München \(MUC\)/);
    assert.equal(publishedPayload.text.includes("Berlin"), false);
  });

  it("should default repeat to 2 and reduce to 1 if more than 1 message is sent per minute", async () => {
    const payloads = [];
    const mockClient = {
      publish: (topic, message, opts, cb) => {
        payloads.push(JSON.parse(message));
        cb(null);
      },
      end: () => {}
    };

    let currentTime = 1000000;
    const publisher = createMqttPublisher({
      config: { repeat: 2 },
      mockClient,
      now: () => currentTime,
      rateLimitWindowMs: 60000
    });

    const flight1 = { airline: "Lufthansa", callsign: "DLH1", origin: "MUC", destination: "HAM" };
    const flight2 = { airline: "Eurowings", callsign: "EWG2", origin: "STR", destination: "HAM" };
    const flight3 = { airline: "Air France", callsign: "AFR3", origin: "CDG", destination: "HAM" };
    const flight4 = { airline: "KLM", callsign: "KLM4", origin: "AMS", destination: "HAM" };

    // 1st message at t = 0s -> should have configured repeat (2)
    await publisher.publishNotification(flight1);
    assert.equal(payloads[0].repeat, 2);

    // 2nd message at t = 20s (within 60s) -> rate > 1 msg/min, repeat reduced to 1
    currentTime += 20000;
    await publisher.publishNotification(flight2);
    assert.equal(payloads[1].repeat, 1);

    // 3rd message at t = 40s (within 60s) -> rate > 1 msg/min, repeat remains 1
    currentTime += 20000;
    await publisher.publishNotification(flight3);
    assert.equal(payloads[2].repeat, 1);

    // 4th message at t = 110s (70s after 3rd message, all prior msgs are > 60s ago)
    currentTime += 70000;
    await publisher.publishNotification(flight4);
    assert.equal(payloads[3].repeat, 2);
  });

  it("should respect displayRepeat config property as fallback", async () => {
    let publishedPayload = null;
    const mockClient = {
      publish: (topic, message, opts, cb) => {
        publishedPayload = JSON.parse(message);
        cb(null);
      },
      end: () => {}
    };

    const publisher = createMqttPublisher({
      config: { displayRepeat: 4 },
      mockClient
    });

    await publisher.publishNotification({ callsign: "TST1" });
    assert.equal(publishedPayload.repeat, 4);
  });
});
