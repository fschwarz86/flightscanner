const { logger } = require("../../utils/logger");

class FlightQueue {
  constructor(options = {}) {
    this.cooldownMs = options.cooldownMs !== undefined ? options.cooldownMs : 1800000; // 30 minutes
    this.processCallback = options.processCallback || null;
    this.delayBetweenFlightsMs = options.delayBetweenFlightsMs !== undefined ? options.delayBetweenFlightsMs : 15000;
    this.activeCooldowns = new Map();
    this.queue = [];
    this.isProcessing = false;
  }

  normalizeKey(key) {
    if (!key || typeof key !== "string") return "";
    return key.trim().toUpperCase();
  }

  getFlightKey(aircraft) {
    if (!aircraft || typeof aircraft !== "object") return "";
    const callsign = this.normalizeKey(aircraft.flight || aircraft.callsign);
    const registration = this.normalizeKey(aircraft.r || aircraft.registration);
    const hex = this.normalizeKey(aircraft.hex);
    return callsign || registration || hex;
  }

  isOnCooldown(key) {
    const normKey = this.normalizeKey(key);
    if (!normKey || !this.activeCooldowns.has(normKey)) return false;

    const timestamp = this.activeCooldowns.get(normKey);
    if (Date.now() - timestamp > this.cooldownMs) {
      this.activeCooldowns.delete(normKey);
      return false;
    }

    return true;
  }

  setCooldown(key) {
    const normKey = this.normalizeKey(key);
    if (!normKey) return;
    this.activeCooldowns.set(normKey, Date.now());
  }

  enqueue(aircraft) {
    const key = this.getFlightKey(aircraft);
    if (!key) return false;

    if (this.isOnCooldown(key)) {
      logger.debug(`Flight ${key} is currently on cooldown, skipping alert`);
      return false;
    }

    // Check if already in active queue
    const alreadyQueued = this.queue.some(item => this.getFlightKey(item) === key);
    if (alreadyQueued) {
      logger.debug(`Flight ${key} is already queued for processing`);
      return false;
    }

    this.setCooldown(key);
    this.queue.push(aircraft);
    logger.debug(`Enqueued flight ${key} (queue length: ${this.queue.length})`);

    this.processNext();
    return true;
  }

  async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const aircraft = this.queue.shift();

    try {
      if (typeof this.processCallback === "function") {
        await this.processCallback(aircraft);
      }
    } catch (err) {
      logger.error(`Error processing queued flight: ${err.message}`);
    }

    if (this.queue.length > 0 && this.delayBetweenFlightsMs > 0) {
      setTimeout(() => {
        this.isProcessing = false;
        this.processNext();
      }, this.delayBetweenFlightsMs);
    } else {
      this.isProcessing = false;
    }
  }

  clear() {
    this.queue = [];
    this.activeCooldowns.clear();
    this.isProcessing = false;
  }

  getQueueLength() {
    return this.queue.length;
  }
}

module.exports = {
  FlightQueue
};
