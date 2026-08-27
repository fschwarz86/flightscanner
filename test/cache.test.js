const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { FlightCache } = require("../src/services/enrichment/cache");

describe("FlightCache Module", () => {
  let cache;

  beforeEach(() => {
    cache = new FlightCache({ defaultTtlMs: 1000, maxSize: 5 });
  });

  it("should store and retrieve values within TTL", () => {
    const data = { flight: "DLH123", route: "MUC-HAM" };
    cache.set("DLH123", data);

    const result = cache.get("DLH123");
    assert.deepEqual(result, data);
    assert.equal(cache.has("DLH123"), true);
  });

  it("should handle case-insensitive keys", () => {
    cache.set("dlh456", { flight: "DLH456" });

    assert.equal(cache.has("DLH456"), true);
    assert.equal(cache.get("DLH456").flight, "DLH456");
  });

  it("should return null and evict expired items", async () => {
    cache.set("EXPIRED_FLIGHT", { flight: "EXP1" }, 50); // 50ms TTL

    assert.equal(cache.has("EXPIRED_FLIGHT"), true);

    await new Promise((r) => setTimeout(r, 60));

    assert.equal(cache.has("EXPIRED_FLIGHT"), false);
    assert.equal(cache.get("EXPIRED_FLIGHT"), null);
  });

  it("should prune all expired entries", async () => {
    cache.set("F1", { id: 1 }, 50);
    cache.set("F2", { id: 2 }, 5000);

    assert.equal(cache.size(), 2);

    await new Promise((r) => setTimeout(r, 60));

    const removed = cache.prune();
    assert.equal(removed, 1);
    assert.equal(cache.size(), 1);
    assert.equal(cache.has("F1"), false);
    assert.equal(cache.has("F2"), true);
  });

  it("should enforce max size limit by evicting oldest item", () => {
    const smallCache = new FlightCache({ defaultTtlMs: 10000, maxSize: 2 });
    smallCache.set("A", { name: "A" });
    smallCache.set("B", { name: "B" });
    smallCache.set("C", { name: "C" });

    assert.equal(smallCache.size(), 2);
    assert.equal(smallCache.has("A"), false); // evicted
    assert.equal(smallCache.has("B"), true);
    assert.equal(smallCache.has("C"), true);
  });
});
