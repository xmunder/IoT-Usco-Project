# Proposal: Revive IoT Dashboard

## Intent
Rescue IoT Dashboard from security vulnerabilities and memory leaks without changing the vanilla JS stack. Provide testability and robust security.

## Scope

### In Scope
- **Security:** Update `database.rules.json` for per-user isolation. Extract firmware/frontend secrets to ignored `credentials.h`/`config.js`. Fix hardcoded UID.
- **Robustness:** Add null-checks for Firebase payloads. Implement cleanup for `onValue` listeners. Fix CO2 gauge bugs.
- **Testing:** Add Jest + jsdom for UI logic testing. Modularize UI via SOLID.
- **Cleanup:** Fix duplicate DOM IDs, redundant imports, and remove dead code.

### Out of Scope
- Migrating to frameworks (React/Vue) or bundlers.
- Changing Firebase SDK version.
- Adding new dashboard features.

## Capabilities

### New Capabilities
- `dashboard-ui`: Managing UI logic and gauges.
- `firebase-integration`: Secure connection, data access, and listener cleanup.

### Modified Capabilities
- None

## Approach
1. **Testing:** Bootstrap Jest + jsdom. Use mocked Firebase data.
2. **Refactor:** Extract UI logic into modular `GaugeManager` and `SensorService`. 
3. **Robustness:** Null-checks and unsubscription arrays.
4. **Security:** Template files (`.example`) and strict Firebase rules.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `database.rules.json` | Modified | Strict auth rules. |
| `firmware/sensors.ino` | Modified | Secrets to `credentials.h`. |
| `public/js/*.js` | Modified | Modularized and testable. |
| `package.json` | Modified | Jest integration. |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missing ESP32 hardware | High | Software mocks. |
| Firebase Rules block DB | High | Emulator tests; manual user deploy required. |

## Rollback Plan
Revert git commit. Restore Firebase rules from console history.

## Dependencies
- Node.js (Jest)

## Success Criteria
- [ ] `npm test` passes for UI modules.
- [ ] No secrets/UIDs in tracked files.
- [ ] No crashes on null Firebase data.
- [ ] `onValue` listeners unsubscribe correctly.
