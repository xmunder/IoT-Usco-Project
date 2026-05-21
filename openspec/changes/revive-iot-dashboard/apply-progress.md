# Implementation Progress

**Change**: revive-iot-dashboard
**Mode**: Standard

### Completed Tasks
- [x] 1.1 Create `.gitignore`, `main/public/config.example.js`, and `main/credentials.example.h` to ignore real secrets while documenting required frontend and firmware config keys.
- [x] 1.2 Create `package.json`, `jest.config.js`, and `tests/setup-jsdom.js` so `npm test` runs Jest + jsdom without adding a bundler or build step.
- [x] 1.3 Create `main/public/scripts/shared/sensor-definitions.js` to centralize sensor keys, DOM selectors, gauge IDs, max values, and fallback text used by UI/tests.
- [x] 2.1 Refactor `main/public/scripts/firebase.js` to read `window.FIREBASE_CONFIG` and expose browser-safe auth/database factories instead of hardcoded app setup.
- [x] 2.2 Create `main/public/scripts/services/sensor-repository.js` with `subscribe(uid, sensorKey, onReading)` and `setToggleStatus(uid, status)` returning unsubscribe callbacks.
- [x] 2.3 Create `main/public/scripts/ui/gauge-manager.js` to own JustGage instances, safe refresh logic, and null/undefined fallback rendering for every sensor, including CO2.
- [x] 2.4 Create `main/public/scripts/ui/auth-view.js` and `main/public/scripts/app/dashboard-controller.js` so auth visibility, power actions, and listener disposal live outside DOM globals.
- [x] 2.5 Create `main/public/scripts/app/bootstrap.js`, slim `main/public/main.js`, and update `main/public/index.html` to use stable selectors, unique IDs, and non-inline event wiring.
- [x] 3.1 Update `main/sensors.ino` to migrate from `Firebase_ESP_Client` to `FirebaseClient`, keep Wokwi-safe inline placeholders, derive `UsersData/{uid}` plus `toggleStatus/status` paths from the authenticated user, and add robust startup diagnostics for Wokwi.
- [x] 3.2 Rewrite `main/database.rules.json` so only `auth.uid === $uid` can access `UsersData/$uid/**`, with validation for numeric sensor nodes and `toggleStatus/status` values `ON|OFF`.
- [x] 3.3 Replace `main/public/scripts/logincheck.js` and `main/public/scripts/guage.js` responsibilities with the new modules, deleting or isolating dead code after imports are rewired.
- [x] 4.1 Add `tests/unit/gauge-manager.test.js`, `tests/unit/auth-view.test.js`, and `tests/unit/sensor-definitions.test.js` covering null readings, fallback output, and selector metadata.
- [x] 4.2 Add `tests/integration/dashboard-controller.test.js` and `tests/integration/bootstrap.test.js` using fake repository/Firebase adapters to verify listener cleanup, re-auth disposal, and power button binding.

### Files Changed
| File | Action | What Was Done |
|------|--------|---------------|
| `main/sensors.ino` | Modified | Rewrote the firmware startup flow for Wokwi diagnostics: deferred FirebaseClient-related construction into setup/loop-time local statics, added `BOOT n` and heartbeat logging, bounded WiFi retries, removed hard MQ135 `while(1)` stops, added `pulseIn` timeout, and kept UID-scoped RTDB writes plus `toggleStatus/status` reads. |
| `docs/revive-iot-dashboard-operacion.md` | Modified | Documented the Wokwi inline-placeholder workflow and the manual smoke expectations for the firmware path. |

### Deviations from Design
- Wokwi/project standards keep inline placeholders in `main/sensors.ino` instead of using `credentials.h`.
- FirebaseClient initialization is now deferred through runtime-local statics to reduce the chance of constructor-time failures before `setup()` can emit serial diagnostics.

### Issues Found
- Firmware compilation and Wokwi execution could not be verified in this environment because `arduino-cli`/`pio` are unavailable and there is no direct simulator runner from this shell.
- Manual Wokwi/Firebase smoke validation is still required for auth, UID acquisition, RTDB writes, `toggleStatus` round-trip behavior, and confirming visible early `BOOT` logs in the Serial Monitor.

### Remaining Tasks
- [ ] 4.3 Verify `npm test`, authenticated browser smoke flow for `main/public/index.html`, firmware path behavior in `main/sensors.ino`, and rules enforcement in `main/database.rules.json` against the spec scenarios.

### Status
13/14 tasks complete. The firmware path is now hardened for Wokwi diagnosis and ready for manual verification.
