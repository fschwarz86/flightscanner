---
quick_id: 261004-hps
slug: add-notification-ttl-to-drop-stale-fligh
status: complete
completed: 2026-10-04
commit: 6193d6a
---

# Quick Task Summary: Notification Staleness Guard + MQTT v5 Expiry

## What Was Done

Fixed the Awtrix display queueing up stale flight notifications when it was
powered off. Two complementary layers were added:

### Layer 1 — Application-level staleness guard (primary fix)
`FlightQueue.enqueue()` now stamps `_enqueuedAt = Date.now()` on every aircraft
object. `publishNotification()` checks this timestamp before publishing. If the
notification is older than `notificationMaxAgeMs` (default 5 minutes), it is
silently dropped with a warn-level log and returns `false`.

This directly addresses the scenario where the Awtrix display is turned off by
the Home Assistant presence automation (`automation.awtrix_abwesenheit`) but
remains connected to the MQTT broker — messages are received and stacked
internally by the Awtrix firmware. When the display turns back on, only flights
detected within the last 5 minutes will notify.

### Layer 2 — MQTT 5 Message Expiry Interval (belt-and-suspenders)
The MQTT client now connects with `protocolVersion: 5`. Every published message
includes `properties: { messageExpiryInterval: N }` (in seconds, matching
`notificationMaxAgeMs`). If the Awtrix truly disconnects and reconnects, the
Mosquitto broker will automatically discard messages past their expiry.

## Files Changed

| File | Change |
|------|--------|
| [`src/config/defaults.js`](../../../../src/config/defaults.js) | `notificationMaxAgeMs: 300000` (5 min default) |
| [`src/services/tracking/queue.js`](../../../../src/services/tracking/queue.js) | Stamp `_enqueuedAt` on enqueue |
| [`src/services/notification/mqtt.js`](../../../../src/services/notification/mqtt.js) | MQTT v5 connect; expiry on publish; staleness guard |
| [`test/mqtt.test.js`](../../../../test/mqtt.test.js) | 5 new tests (stale dropped, fresh passes, v5 properties, configurable TTL, backwards compat) |
| [`test/queue.test.js`](../../../../test/queue.test.js) | 1 new test (_enqueuedAt stamp) |

## Decisions

- Default TTL is 5 minutes — reasonable for a flight monitoring service where a
  flight traverses the geofence in ~1–3 minutes. Configurable via
  `notificationMaxAgeMs` in `/etc/flightscanner/config.json`.
- Backwards compatible: if `_enqueuedAt` is absent, the staleness check is
  skipped and the notification always publishes.
- `protocolVersion: 5` is supported by Mosquitto 2.x (Home Assistant's bundled
  version). Older brokers will negotiate down via protocol negotiation.
