---
task_id: 260907-d8a
slug: configurable-display-repeat-rate-limit
title: "Configure display repetitions (default 2) and dynamic rate-limiting to 1 repetition if >1 message/min"
date: "2026-09-07"
status: complete
commit: "039b038"
---

# Quick Task Summary: 260907-d8a

Configured number of repetitions for Awtrix display notifications to default to 2, made it configurable via configuration files and environment variables, and implemented dynamic rate-limiting to automatically reduce repetitions to 1 if more than 1 notification is published per minute.

## Key Changes

1. **Configuration**:
   - Added `repeat: 2` to `defaultConfig` in [`src/config/defaults.js`](file:///usr/local/google/home/fschwarz/spark/flightscanner/src/config/defaults.js).
   - In [`src/config/index.js`](file:///usr/local/google/home/fschwarz/spark/flightscanner/src/config/index.js):
     - Mapped `DISPLAY_REPEAT`, `REPEAT`, and `NOTIFICATION_REPEAT` environment variables.
     - Supported `displayRepeat` fallback property.
     - Added validation in `validateConfig` ensuring `repeat` is a non-negative integer.
   - Updated [`config/flightscanner.json.example`](file:///usr/local/google/home/fschwarz/spark/flightscanner/config/flightscanner.json.example) and [`config/default-flightscanner.example`](file:///usr/local/google/home/fschwarz/spark/flightscanner/config/default-flightscanner.example).

2. **Formatter**:
   - In [`src/services/notification/formatter.js`](file:///usr/local/google/home/fschwarz/spark/flightscanner/src/services/notification/formatter.js), updated `formatNotificationPayload` default `repeat` from 3 to 2.

3. **Rate-Adaptive Notification Throttling**:
   - In [`src/services/notification/mqtt.js`](file:///usr/local/google/home/fschwarz/spark/flightscanner/src/services/notification/mqtt.js):
     - Maintained a sliding 60-second window of published notification timestamps.
     - Evaluated notification rate upon publishing: if at least 1 other notification was sent in the last 60 seconds (rate > 1 msg/min), repetitions are reduced from the configured value to `1`.
     - After 60 seconds of inactivity without further messages, repeat count automatically reverts to the configured default (e.g. 2).
     - Cleaned up tracking history on publisher `close()`.

4. **Testing**:
   - Added configuration unit tests in [`test/config.test.js`](file:///usr/local/google/home/fschwarz/spark/flightscanner/test/config.test.js) for default value (2), JSON override, env vars (`DISPLAY_REPEAT`, `REPEAT`, `NOTIFICATION_REPEAT`), and validation.
   - Updated formatter tests in [`test/formatter.test.js`](file:///usr/local/google/home/fschwarz/spark/flightscanner/test/formatter.test.js) verifying default repeat (2) and explicit override.
   - Added publisher tests in [`test/mqtt.test.js`](file:///usr/local/google/home/fschwarz/spark/flightscanner/test/mqtt.test.js) asserting repeat=2 on first message, dynamic reduction to 1 on subsequent messages within 60s, and recovery back to 2 after 60s.
   - Verified all 79 tests passing.
