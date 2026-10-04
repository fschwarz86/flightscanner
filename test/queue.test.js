const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { FlightQueue } = require("../src/services/tracking/queue");

describe("FlightQueue Module", () => {
  let queue;
  let processedItems = [];

  beforeEach(() => {
    processedItems = [];
    queue = new FlightQueue({
      cooldownMs: 50, // 50ms for quick testing
      delayBetweenFlightsMs: 10,
      processCallback: async (item) => {
        processedItems.push(item);
      }
    });
  });

  it("should enqueue and process flight via callback", async () => {
    const flight = { flight: "DLH123", hex: "3c66b7" };
    const enqueued = queue.enqueue(flight);

    assert.equal(enqueued, true);
    await new Promise((r) => setTimeout(r, 20));

    assert.equal(processedItems.length, 1);
    assert.equal(processedItems[0].flight, "DLH123");
  });

  it("should suppress duplicate flights within cooldown period", async () => {
    const flight = { flight: "DLH123", hex: "3c66b7" };
    const first = queue.enqueue(flight);
    const second = queue.enqueue(flight);

    assert.equal(first, true);
    assert.equal(second, false);

    await new Promise((r) => setTimeout(r, 20));
    assert.equal(processedItems.length, 1);
  });

  it("should allow flight to be re-enqueued after cooldown expires", async () => {
    const flight = { flight: "DLH456" };
    queue.enqueue(flight);

    await new Promise((r) => setTimeout(r, 70)); // wait for 50ms cooldown to expire

    const second = queue.enqueue(flight);
    assert.equal(second, true);

    await new Promise((r) => setTimeout(r, 20));
    assert.equal(processedItems.length, 2);
  });

  it("should process multiple distinct flights in order", async () => {
    const f1 = { flight: "F1" };
    const f2 = { flight: "F2" };

    queue.enqueue(f1);
    queue.enqueue(f2);

    await new Promise((r) => setTimeout(r, 40));

    assert.equal(processedItems.length, 2);
    assert.equal(processedItems[0].flight, "F1");
    assert.equal(processedItems[1].flight, "F2");
  });

  it("should clear active queue and cooldowns", () => {
    queue.enqueue({ flight: "F99" });
    assert.equal(queue.isOnCooldown("F99"), true);

    queue.clear();
    assert.equal(queue.isOnCooldown("F99"), false);
    assert.equal(queue.getQueueLength(), 0);
  });

  it("should stamp _enqueuedAt on aircraft when enqueued", async () => {
    const before = Date.now();
    const flight = { flight: "DLH789" };
    queue.enqueue(flight);

    const after = Date.now();
    assert.ok(flight._enqueuedAt >= before, "_enqueuedAt should be at or after enqueue start");
    assert.ok(flight._enqueuedAt <= after, "_enqueuedAt should be at or before enqueue end");
    assert.equal(typeof flight._enqueuedAt, "number");
  });
});
