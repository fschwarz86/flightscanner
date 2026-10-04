---
quick_id: 261004-hps
slug: add-notification-ttl-to-drop-stale-fligh
description: "Add notification TTL to drop stale flight alerts when Awtrix display was off"
status: in-progress
created: 2026-10-04
---

# Quick Task: Add Notification TTL / Staleness Guard

## Problem

When the Awtrix display is turned off (via Home Assistant presence automation
`light.buro_awtrix_matrix`), the device stays connected to the MQTT broker. It
silently receives all `awtrix/cmd/notify` messages and queues them internally.
When the display turns back on, all stacked notifications play through — showing
flights that flew by hours ago.

## Root Cause

- The Awtrix firmware keeps an internal notification queue independent of the
  display power state.
- Flightscanner correctly uses QoS 0 (broker does not queue for offline clients),
  but the device itself still receives and stacks messages while powered off.

## Solution

Two complementary, lightweight layers:

### Layer 1 — Application-level staleness guard (primary fix)
- Stamp `enqueuedAt = Date.now()` on each aircraft object when it enters the
  `FlightQueue`.
- In `publishNotification`, compare `flightData.enqueuedAt` to current time.
- If older than `notificationMaxAgeMs` (configurable, default 5 min), **skip
  publishing** and log a warning.

### Layer 2 — MQTT 5 Message Expiry Interval (belt-and-suspenders)
- Connect with `protocolVersion: 5` (fully backward compatible with Mosquitto).
- Publish with `properties: { messageExpiryInterval: N }` (seconds, same TTL
  as `notificationMaxAgeMs`).
- The broker will discard the message after N seconds if the device truly
  disconnects and reconnects.

## Files Changed

| File | Change |
|------|--------|
| `src/config/defaults.js` | Add `notificationMaxAgeMs: 300000` (5 min) |
| `src/services/tracking/queue.js` | Stamp `_enqueuedAt` on aircraft when enqueued |
| `src/services/notification/mqtt.js` | MQTT v5 connect; expiry on publish; staleness guard in `publishNotification` |
| `test/mqtt.test.js` | Tests for: stale notification dropped; fresh notification published; MQTT v5 properties present |

## Acceptance Criteria

1. A notification older than `notificationMaxAgeMs` is silently dropped with a
   warn log; `publishNotification` returns `false`.
2. A fresh notification (within TTL) still publishes successfully.
3. Published MQTT messages include `properties.messageExpiryInterval` when
   MQTT v5 is used.
4. `enqueuedAt` is stamped on aircraft objects when they enter the queue.
5. `notificationMaxAgeMs` is configurable via config file / env var.
6. All existing tests continue to pass.
