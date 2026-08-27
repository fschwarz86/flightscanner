class FlightCache {
  constructor(options = {}) {
    this.defaultTtlMs = options.defaultTtlMs || 14400000; // 4 hours default
    this.maxSize = options.maxSize || 1000;
    this.store = new Map();
  }

  normalizeKey(key) {
    if (!key || typeof key !== "string") return "";
    return key.trim().toUpperCase();
  }

  get(key) {
    const normKey = this.normalizeKey(key);
    if (!normKey || !this.store.has(normKey)) return null;

    const entry = this.store.get(normKey);
    if (Date.now() > entry.expiresAt) {
      this.store.delete(normKey);
      return null;
    }

    return entry.value;
  }

  set(key, value, ttlMs = null) {
    const normKey = this.normalizeKey(key);
    if (!normKey) return false;

    // Prune if reaching capacity
    if (this.store.size >= this.maxSize) {
      this.prune();
      if (this.store.size >= this.maxSize) {
        // Evict oldest entry
        const oldestKey = this.store.keys().next().value;
        this.store.delete(oldestKey);
      }
    }

    const ttl = ttlMs !== null && ttlMs !== undefined && !isNaN(ttlMs) && ttlMs > 0 ? ttlMs : this.defaultTtlMs;
    const expiresAt = Date.now() + ttl;

    this.store.set(normKey, {
      value,
      expiresAt
    });

    return true;
  }

  has(key) {
    const normKey = this.normalizeKey(key);
    if (!normKey || !this.store.has(normKey)) return false;

    const entry = this.store.get(normKey);
    if (Date.now() > entry.expiresAt) {
      this.store.delete(normKey);
      return false;
    }

    return true;
  }

  delete(key) {
    const normKey = this.normalizeKey(key);
    if (!normKey) return false;
    return this.store.delete(normKey);
  }

  clear() {
    this.store.clear();
  }

  prune() {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        removed++;
      }
    }
    return removed;
  }

  size() {
    this.prune();
    return this.store.size;
  }
}

module.exports = {
  FlightCache
};
