# Tasks: Revive IoT Dashboard

## Phase 1: Foundation

- [x] 1.1 Create `.gitignore`, `main/public/config.example.js`, and `main/credentials.example.h` to ignore real secrets while documenting required frontend and firmware config keys.
- [x] 1.2 Create `package.json`, `jest.config.js`, and `tests/setup-jsdom.js` so `npm test` runs Jest + jsdom without adding a bundler or build step.
- [x] 1.3 Create `main/public/scripts/shared/sensor-definitions.js` to centralize sensor keys, DOM selectors, gauge IDs, max values, and fallback text used by UI/tests.

## Phase 2: Frontend modular refactor

- [x] 2.1 Refactor `main/public/scripts/firebase.js` to read `window.FIREBASE_CONFIG` and expose browser-safe auth/database factories instead of hardcoded app setup.
- [x] 2.2 Create `main/public/scripts/services/sensor-repository.js` with `subscribe(uid, sensorKey, onReading)` and `setToggleStatus(uid, status)` returning unsubscribe callbacks.
- [x] 2.3 Create `main/public/scripts/ui/gauge-manager.js` to own JustGage instances, safe refresh logic, and null/undefined fallback rendering for every sensor, including CO2.
- [x] 2.4 Create `main/public/scripts/ui/auth-view.js` and `main/public/scripts/app/dashboard-controller.js` so auth visibility, power actions, and listener disposal live outside DOM globals.
- [x] 2.5 Create `main/public/scripts/app/bootstrap.js`, slim `main/public/main.js`, and update `main/public/index.html` to use stable selectors, unique IDs, and non-inline event wiring.

## Phase 3: Security and firmware alignment

- [x] 3.1 Update `main/sensors.ino` to include `credentials.h`, remove hardcoded WiFi/Firebase values, and derive `UsersData/{uid}` plus `toggleStatus/status` paths from the authenticated user.
- [x] 3.2 Rewrite `main/database.rules.json` so only `auth.uid === $uid` can access `UsersData/$uid/**`, with validation for numeric sensor nodes and `toggleStatus/status` values `ON|OFF`.
- [x] 3.3 Replace `main/public/scripts/logincheck.js` and `main/public/scripts/guage.js` responsibilities with the new modules, deleting or isolating dead code after imports are rewired.

## Phase 4: Tests and verification

- [x] 4.1 Add `tests/unit/gauge-manager.test.js`, `tests/unit/auth-view.test.js`, and `tests/unit/sensor-definitions.test.js` covering null readings, fallback output, and selector metadata.
- [x] 4.2 Add `tests/integration/dashboard-controller.test.js` and `tests/integration/bootstrap.test.js` using fake repository/Firebase adapters to verify listener cleanup, re-auth disposal, and power button binding.
- [~] 4.3 Verify `npm test`, authenticated browser smoke flow for `main/public/index.html`, firmware path behavior in `main/sensors.ino`, and rules enforcement in `main/database.rules.json` against the spec scenarios. (`npm test` + Playwright + user-confirmed Wokwi/frontend runtime done; Firebase rules enforcement still pending)
  - [ ] 4.3.a Add minimal RTDB rules-testing/emulator infrastructure for `main/database.rules.json`.
  - [ ] 4.3.b Add automated tests that prove UID-scoped allow/deny behavior, numeric validation, and `toggleStatus/status` value enforcement.
  - [ ] 4.3.c Integrate execution/docs evidence so rules verification is reproducible from the repo.
