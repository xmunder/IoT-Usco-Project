# Implementation Progress

**Change**: modernize-ui-shoelace
**Mode**: Standard

### Completed Tasks
- [x] 1.1 Update `main/public/index.html` `<head>`/footer to remove Bootstrap, FontAwesome, and Toastify assets; add version-pinned Shoelace theme + autoloader CDN while preserving `main.js`, Firebase, Raphael, and JustGage load order.
- [x] 1.2 Refactor `main/public/index.html` auth shell to use `sl-button`, `sl-dialog`, and `sl-input`, keeping `#login-form`, `#login-email`, `#login-password`, `#login-button`, `#logout`, `data-auth`, and `data-visibility` unchanged.
- [x] 1.3 Replace sensor/action markup in `main/public/index.html` with `sl-card`, `sl-icon`, and Shoelace-styled action buttons, preserving every `#gauge-*`, `[data-sensor-value]`, and `[data-toggle-status]` node in light DOM.
- [x] 2.1 Update `main/public/scripts/app/bootstrap.js` to open the login `sl-dialog` from `#login-button`, close it with `dialog.hide()` after successful sign-in, and remove all `globalThis.bootstrap.Modal` usage without changing Firebase orchestration.
- [x] 2.2 Refactor `main/public/scripts/showmessage.js` to emit Shoelace `sl-alert` toasts for success/error states, with console fallback when Shoelace is unavailable.
- [x] 3.1 Rewrite `main/public/style.css` layout rules to replace Bootstrap containers/navbar/grid with native flexbox + responsive CSS Grid for the authenticated dashboard scenarios from `specs/dashboard-ui/spec.md`.
- [x] 3.2 Add Shoelace theme tokens and component-specific styles in `main/public/style.css` for USCO colors, dialog spacing, card headings, and power-control actions without overriding gauge rendering behavior.
- [x] 4.1 Update `tests/integration/bootstrap.test.js` to mock `sl-dialog` `show()`/`hide()` behavior and verify login open, successful submit, logout, and absence of Bootstrap modal dependencies.
- [x] 4.2 Update `tests/unit/auth-view.test.js` and `tests/unit/gauge-manager.test.js` to cover unchanged `hidden` toggles with Shoelace markup and JustGage rendering inside `sl-card` light DOM.
- [x] 4.3 Add `tests/unit/showmessage.test.js` for Shoelace alert toast creation and fallback logging, then verify the affected scenarios still match `openspec/changes/modernize-ui-shoelace/specs/dashboard-ui/spec.md`.

### Additional Work This Batch
- [x] Added Playwright as a real-browser/headless verification layer using a lightweight static server, local Shoelace asset routing, and browser-side Firebase mocks so the frontend can be exercised without a build step.
- [x] Added browser smoke coverage for the anonymous landing state, login dialog open/close behavior, desktop layout/flex-grid assertions, and authenticated JustGage rendering after mocked realtime sensor updates.
- [x] Reproduced the runtime bug where hidden-gated UI could still become visually exposed before login in a real browser, fixed it with a global `[hidden] { display: none !important; }` safeguard, and captured it in Playwright.
- [x] Ran the relevant suites: `npm test` and `npx playwright test`.

### Files Changed
| File | Action | What Was Done |
|------|--------|---------------|
| `main/public/index.html` | Modified | Replaced Bootstrap/FontAwesome/Toastify assets with Shoelace 2.20.1 CDN, rebuilt the auth shell with `sl-dialog`/`sl-input`/`sl-button`, and wrapped sensors/power controls in `sl-card` + `sl-icon` while preserving IDs and data attributes. |
| `main/public/style.css` | Modified | Rewrote the page shell with native flex/grid layout, added Shoelace design tokens for USCO branding, and added a global `[hidden] { display: none !important; }` safeguard so auth-gated sections stay visually hidden in the real browser. |
| `main/public/scripts/app/bootstrap.js` | Modified | Removed Bootstrap modal coupling, added explicit login dialog open/close wiring, and normalized Shoelace input reset after successful sign-in. |
| `main/public/scripts/firebase.js` | Modified | Added an optional browser-test factory hook so Playwright can replace live Firebase with a deterministic fake client without changing production runtime behavior. |
| `main/public/scripts/showmessage.js` | Modified | Replaced Toastify with imperative Shoelace `sl-alert` toast creation plus console fallback when toast APIs are unavailable. |
| `tests/integration/bootstrap.test.js` | Modified | Verified login open, submit success, logout, and zero reliance on Bootstrap modal APIs. |
| `tests/unit/auth-view.test.js` | Modified | Revalidated auth visibility toggles against Shoelace-flavored markup. |
| `tests/unit/gauge-manager.test.js` | Modified | Confirmed hidden handling and JustGage rendering continue to work inside `sl-card` light DOM. |
| `tests/unit/showmessage.test.js` | Created | Added coverage for Shoelace toast creation and fallback console logging. |
| `jest.config.js` | Modified | Excluded `tests/playwright/` from Jest discovery so Jest and Playwright can coexist without cross-running suites. |
| `package.json` | Modified | Added `test:e2e` and `test:e2e:headed` scripts plus Playwright/Shoelace dev dependencies for no-build browser testing. |
| `package-lock.json` | Modified | Locked the new Playwright and local Shoelace test dependencies. |
| `playwright.config.js` | Created | Configured headless Playwright plus a lightweight static web server instead of a build step. |
| `tests/playwright/server.mjs` | Created | Added the no-build static file server used by Playwright `webServer`. |
| `tests/playwright/helpers/browser-mocks.js` | Created | Routed Shoelace CDN requests to local assets and injected browser-side Firebase/auth/reading mocks with visibility tracking. |
| `tests/playwright/dashboard-smoke.spec.js` | Created | Added smoke tests for anonymous view, login dialog UX, authenticated layout visibility, and runtime gauge rendering. |
| `.gitignore` | Modified | Ignored Playwright output directories. |
| `openspec/changes/modernize-ui-shoelace/tasks.md` | Modified | Marked all change tasks complete in OpenSpec. |

### Deviations from Design
- Minor extension: `design.md` originally deferred E2E/browser infrastructure, but this batch added Playwright plus a narrow `firebase.js` test hook to satisfy real-browser verification without introducing a build step or changing production Firebase wiring.

### Issues Found
- Reproduced a real-browser visibility bug: elements gated only by the `hidden` attribute could still render visibly before/after auth transitions. Fixed by enforcing `[hidden] { display: none !important; }` in `main/public/style.css` and covering the regression in Playwright.
- No remaining functional blockers. `npm test` passed with 7 suites / 14 tests and `npx playwright test` passed with 3 smoke tests.

### Remaining Tasks
- [ ] None.

### Status
10/10 original tasks complete. Runtime browser smoke coverage added and the anonymous/auth visibility bug is fixed. Ready for verify.
