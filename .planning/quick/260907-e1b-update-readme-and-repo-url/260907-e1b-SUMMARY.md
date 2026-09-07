---
task_id: 260907-e1b
slug: update-readme-and-repo-url
title: "Update README with latest changes and fix repo URL to fschwarz86/flightscanner"
date: "2026-09-07"
status: complete
commit: "b8d1530"
---

# Quick Task Summary: 260907-e1b

Updated README.md, .env.example, and systemd service unit to document the latest features and corrected the GitHub repository URL to `https://github.com/fschwarz86/flightscanner`.

## Key Changes

1. **Repository URLs**:
   - Fixed git clone URL in [`README.md`](file:///usr/local/google/home/fschwarz/spark/flightscanner/README.md#L127) to `https://github.com/fschwarz86/flightscanner.git`.
   - Fixed `Documentation` URL in [`systemd/flightscanner.service`](file:///usr/local/google/home/fschwarz/spark/flightscanner/systemd/flightscanner.service#L3) to `https://github.com/fschwarz86/flightscanner`.

2. **Feature Documentation**:
   - Updated test suite count from 47 to 79 tests.
   - Documented `BASE_AIRPORT` / `baseAirport` configuration (default: `HAM`) and strict airport code matching rules preventing nearby airfields (e.g., Hamburg-Finkenwerder `XFW`) from false-matching.
   - Documented `DISPLAY_REPEAT` / `repeat` / `displayRepeat` configuration (default: `2`) and dynamic rate-limiting reduction to `1` when sending >1 message per minute.
   - Added a dedicated section: **📺 Notification Formatting & Awtrix Integration** detailing route direction formatting (`<- $ORIGIN`, `-> $DESTINATION`, `$ORIGIN -> $DESTINATION`) and rate-adaptive scrolling behavior.
   - Updated configuration parameters table in [`README.md`](file:///usr/local/google/home/fschwarz/spark/flightscanner/README.md#L96) and example environment in [`.env.example`](file:///usr/local/google/home/fschwarz/spark/flightscanner/.env.example#L8).
