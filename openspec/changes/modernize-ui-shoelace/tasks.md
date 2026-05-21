# Tasks: Modernize UI with Shoelace

## Phase 1: UI Foundation

- [x] 1.1 Update `main/public/index.html` `<head>`/footer to remove Bootstrap, FontAwesome, and Toastify assets; add version-pinned Shoelace theme + autoloader CDN while preserving `main.js`, Firebase, Raphael, and JustGage load order.
- [x] 1.2 Refactor `main/public/index.html` auth shell to use `sl-button`, `sl-dialog`, and `sl-input`, keeping `#login-form`, `#login-email`, `#login-password`, `#login-button`, `#logout`, `data-auth`, and `data-visibility` unchanged.
- [x] 1.3 Replace sensor/action markup in `main/public/index.html` with `sl-card`, `sl-icon`, and Shoelace-styled action buttons, preserving every `#gauge-*`, `[data-sensor-value]`, and `[data-toggle-status]` node in light DOM.

## Phase 2: Interaction Wiring

- [x] 2.1 Update `main/public/scripts/app/bootstrap.js` to open the login `sl-dialog` from `#login-button`, close it with `dialog.hide()` after successful sign-in, and remove all `globalThis.bootstrap.Modal` usage without changing Firebase orchestration.
- [x] 2.2 Refactor `main/public/scripts/showmessage.js` to emit Shoelace `sl-alert` toasts for success/error states, with console fallback when Shoelace is unavailable.

## Phase 3: Responsive Layout and Theming

- [x] 3.1 Rewrite `main/public/style.css` layout rules to replace Bootstrap containers/navbar/grid with native flexbox + responsive CSS Grid for the authenticated dashboard scenarios from `specs/dashboard-ui/spec.md`.
- [x] 3.2 Add Shoelace theme tokens and component-specific styles in `main/public/style.css` for USCO colors, dialog spacing, card headings, and power-control actions without overriding gauge rendering behavior.

## Phase 4: Tests and Verification

- [x] 4.1 Update `tests/integration/bootstrap.test.js` to mock `sl-dialog` `show()`/`hide()` behavior and verify login open, successful submit, logout, and absence of Bootstrap modal dependencies.
- [x] 4.2 Update `tests/unit/auth-view.test.js` and `tests/unit/gauge-manager.test.js` to cover unchanged `hidden` toggles with Shoelace markup and JustGage rendering inside `sl-card` light DOM.
- [x] 4.3 Add `tests/unit/showmessage.test.js` for Shoelace alert toast creation and fallback logging, then verify the affected scenarios still match `openspec/changes/modernize-ui-shoelace/specs/dashboard-ui/spec.md`.
