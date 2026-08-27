const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { logger, LOG_LEVELS } = require("../src/utils/logger");

describe("Logger Module", () => {
  let originalLevel;
  let logCalls = [];
  let debugCalls = [];
  let warnCalls = [];
  let errorCalls = [];

  const originalConsole = {
    log: console.log,
    debug: console.debug,
    warn: console.warn,
    error: console.error
  };

  beforeEach(() => {
    originalLevel = logger.getLevel();
    logCalls = [];
    debugCalls = [];
    warnCalls = [];
    errorCalls = [];

    console.log = (...args) => logCalls.push(args.join(" "));
    console.debug = (...args) => debugCalls.push(args.join(" "));
    console.warn = (...args) => warnCalls.push(args.join(" "));
    console.error = (...args) => errorCalls.push(args.join(" "));
  });

  afterEach(() => {
    logger.setLevel(originalLevel);
    console.log = originalConsole.log;
    console.debug = originalConsole.debug;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  it("should respect default info log level and filter out debug calls", () => {
    logger.setLevel("info");
    logger.debug("debug message");
    logger.info("info message");
    logger.warn("warn message");
    logger.error("error message");

    assert.equal(debugCalls.length, 0);
    assert.equal(logCalls.length, 1);
    assert.match(logCalls[0], /\[INFO\] info message/);
    assert.equal(warnCalls.length, 1);
    assert.match(warnCalls[0], /\[WARN\] warn message/);
    assert.equal(errorCalls.length, 1);
    assert.match(errorCalls[0], /\[ERROR\] error message/);
  });

  it("should allow debug messages when log level is set to debug", () => {
    logger.setLevel("debug");
    logger.debug("debug trace");

    assert.equal(debugCalls.length, 1);
    assert.match(debugCalls[0], /\[DEBUG\] debug trace/);
  });

  it("should suppress info and warn messages when log level is error", () => {
    logger.setLevel("error");
    logger.debug("debug message");
    logger.info("info message");
    logger.warn("warn message");
    logger.error("fatal error");

    assert.equal(debugCalls.length, 0);
    assert.equal(logCalls.length, 0);
    assert.equal(warnCalls.length, 0);
    assert.equal(errorCalls.length, 1);
    assert.match(errorCalls[0], /\[ERROR\] fatal error/);
  });
});
