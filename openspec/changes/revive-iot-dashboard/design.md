# Design: Revive IoT Dashboard

## Technical Approach

Refactor `main/public/main.js` from monolithic script into a thin bootstrap that wires Firebase, UI, and lifecycle modules through explicit interfaces. Keep HTML/CSS/JS vanilla and Firebase CDN SDK, but move app logic into small ES modules that can be tested in Jest/jsdom without importing Firebase CDN code. In firmware, migrate to `FirebaseClient`, derive every RTDB path from the authenticated UID, and support the Wokwi single-file workflow with inline placeholders inside `main/sensors.ino`.

## Architecture Decisions

| Decision | Options | Choice | Rationale |
|---|---|---|---|
| Frontend structure | Keep monolith / modular ES modules | Modular ES modules under `main/public/scripts/` | Preserves stack, improves SRP, and creates test seams without bundlers. |
| Firebase coupling | UI imports SDK directly / repository adapter | `firebase-browser-client` + `sensor-repository` adapter | DOM code stops depending on Firebase primitives, so jsdom tests can mock subscriptions and writes. |
| Subscription lifecycle | Fire `onValue` ad hoc / controller-owned disposables | `DashboardController` stores unsubscribe callbacks and disposes on logout/re-auth | Fixes current memory leaks and zombie listeners. |
| Secrets/config | Hardcode / ignored templates / Wokwi inline placeholders | `main/public/config.js` ignored; `main/public/config.example.js` committed; firmware uses inline placeholders in `main/sensors.ino` for Wokwi and documents the secret-bearing values explicitly | Wokwi only supports a single `.ino` comfortably, so firmware uses inline placeholders for simulation while frontend config remains environment-specific and RTDB rules stay the true security boundary. |
| RTDB rules | Timestamp gate / UID-scoped auth rules | `UsersData/$uid` read/write only when `auth.uid === $uid` with basic validation | Removes expired public access and matches both browser and ESP32 paths. |

## Data Flow

```text
index.html -> main.js -> bootstrapDashboard()
                     -> FirebaseBrowserClient(auth, db)
                     -> DashboardController
                        -> AuthView.render(user)
                        -> SensorRepository.subscribe(uid, sensor, onReading)
                        -> GaugeManager.render(sensor, reading)
                        -> PowerToggle.setStatus(uid, "ON"|"OFF")

ESP32/Wokwi -> inline placeholders in sensors.ino -> FirebaseClient auth -> uid
     -> write UsersData/{uid}/{sensor}
     -> read  UsersData/{uid}/toggleStatus/status
```

## File Changes

| File | Action | Description |
|---|---|---|
| `openspec/changes/revive-iot-dashboard/design.md` | Create | Technical design artifact. |
| `.gitignore` | Create | Ignore `main/credentials.h`, `main/public/config.js`, coverage, and test artifacts. |
| `package.json` / `jest.config.js` | Create | Jest + jsdom setup without build step. |
| `main/public/main.js` | Modify | Become bootstrap-only entrypoint. |
| `main/public/index.html` | Modify | Fix duplicate IDs, add stable selectors, remove inline `onclick` coupling. |
| `main/public/scripts/firebase.js` | Modify | Read `window.FIREBASE_CONFIG`, export initialized client/factories only. |
| `main/public/scripts/app/bootstrap.js` | Create | Compose dependencies and auth lifecycle. |
| `main/public/scripts/app/dashboard-controller.js` | Create | Start/stop subscriptions, bind power actions, own cleanup bag. |
| `main/public/scripts/services/sensor-repository.js` | Create | Subscribe/write contract over Firebase RTDB. |
| `main/public/scripts/ui/gauge-manager.js` | Create | Own JustGage instances and safe refresh/fallback rendering. |
| `main/public/scripts/ui/auth-view.js` | Create | Replace `logincheck.js` with DOM-only auth visibility logic. |
| `main/public/scripts/shared/sensor-definitions.js` | Create | Sensor metadata: DB key, DOM id, gauge config, fallback. |
| `main/public/config.example.js` / `main/credentials.example.h` | Create | Safe templates for frontend and legacy firmware config documentation. |
| `main/database.rules.json` | Modify | UID-scoped rules and `toggleStatus` validation. |
| `main/sensors.ino` | Modify | Use `FirebaseClient`, keep Wokwi-safe inline placeholders, derive dynamic UID path for toggle read, and add startup diagnostics. |

## Interfaces / Contracts

```js
// sensor-repository.js
subscribe(uid, sensorKey, onReading) => unsubscribeFn
setToggleStatus(uid, status /* "ON" | "OFF" */) => Promise<void>

// dashboard-controller.js
start(user)
dispose()

// sensor-definitions.js
[{ key, elementId, gaugeId, max, fallbackText }]
```

RTDB contract:
- `UsersData/{uid}/{temperature|humidity|distance|co|alcohol|co2}` -> numeric
- `UsersData/{uid}/toggleStatus/status` -> `"ON" | "OFF"`

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | `formatReading`, `auth-view`, `sensor-definitions`, null handling | Pure Jest tests. |
| Unit | `DashboardController` cleanup and re-auth disposal | Mock repository/gauge manager; assert unsubscribe calls. |
| Integration | Bootstrap + DOM rendering + power button binding | Jest + jsdom with fake Firebase adapter. |
| Manual/E2E | Browser login, live readings, Wokwi/ESP32 toggle round-trip, rules deploy | Playwright for browser smoke; authenticated Wokwi/manual smoke for firmware; Firebase runtime rules check still manual unless emulator is added. |

## Migration / Rollout

No data migration required. Rollout order: add ignored templates, refactor frontend modules, update firmware UID path, then deploy `database.rules.json` last and validate with one authenticated browser user plus one firmware/Wokwi user.

## Open Questions

- [ ] Is Firebase Console access available to deploy and verify the new RTDB rules?
- [ ] Is physical ESP32 hardware available for final toggle round-trip validation?
