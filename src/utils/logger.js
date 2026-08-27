const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

let currentLevel = "info";

function setLevel(level) {
  if (level && Object.prototype.hasOwnProperty.call(LOG_LEVELS, level.toLowerCase())) {
    currentLevel = level.toLowerCase();
  }
}

function shouldLog(level) {
  const currentPriority = LOG_LEVELS[currentLevel] ?? LOG_LEVELS.info;
  const messagePriority = LOG_LEVELS[level] ?? LOG_LEVELS.info;
  return messagePriority >= currentPriority;
}

function formatPrefix(level) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}]`;
}

const logger = {
  debug(message, ...args) {
    if (shouldLog("debug")) {
      console.debug(formatPrefix("debug"), message, ...args);
    }
  },
  info(message, ...args) {
    if (shouldLog("info")) {
      console.log(formatPrefix("info"), message, ...args);
    }
  },
  warn(message, ...args) {
    if (shouldLog("warn")) {
      console.warn(formatPrefix("warn"), message, ...args);
    }
  },
  error(message, ...args) {
    if (shouldLog("error")) {
      console.error(formatPrefix("error"), message, ...args);
    }
  },
  setLevel(level) {
    setLevel(level);
  },
  getLevel() {
    return currentLevel;
  }
};

module.exports = {
  logger,
  LOG_LEVELS
};
