---
quick_id: 260907-c1u
slug: change-the-notification-for-incoming-fli
title: "Omit destination airport if HAM and show <- $ORIGIN for incoming flights"
date: "2026-09-07"
status: complete
commit: 09aa55c
---

# Quick Task Summary: 260907-c1u

## Description
Change the notification for incoming flights to omit the destination airport if it's HAM and show "<- $ORIGIN" (symmetrical to outgoing flights showing "-> $DESTINATION").

## Key Changes
- **`src/services/notification/formatter.js`**:
  - Added `isHamburgDestination` detection checking if destination airport contains `(HAM)` or begins with `hamburg`.
  - When `isHamburgDestination` is true and `!isHamburgOrigin`, returns `${flightLabel}${aircraftTag} <- ${origin || "Unbekannt"}`.
  - When `isHamburgOrigin` is true and `!isHamburgDestination`, returns `${flightLabel}${aircraftTag} -> ${destination || "Unbekannt"}`.
  - Retains full `${origin} -> ${destination}` formatting for transit/overflights or round trips.
- **`test/formatter.test.js`**:
  - Updated arrival test cases to assert `<- München (MUC)`.
  - Added test case for transit flights where neither airport is Hamburg.
  - Added test case for arrival with unknown origin (`<- Unbekannt`).
  - Updated payload test to verify `<- München (MUC)` and ensure Hamburg is omitted.

## Verification
- Ran `npm test`: all 61 tests across 15 suites pass cleanly (0 failures).
