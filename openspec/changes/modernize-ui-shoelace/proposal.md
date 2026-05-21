# Proposal: modernize-ui-shoelace

## Intent
Migrate the IoT dashboard UI from Bootstrap and FontAwesome to Shoelace Web Components. This change will modernize the look and feel, improve accessibility, and reduce external dependencies, all while preserving the existing Firebase logic and sensor visualization tools (JustGage).

## Scope

### In Scope
- Replace Bootstrap Navbar with native flexbox and Shoelace buttons (`sl-button`).
- Replace Bootstrap Modal with Shoelace Dialog (`sl-dialog`) for the login form.
- Use Shoelace Inputs (`sl-input`) for email and password fields.
- Wrap sensor visualizations in Shoelace Cards (`sl-card`).
- Replace FontAwesome icons with Shoelace Icons (`sl-icon`).
- Update layout to use standard CSS Grid/Flexbox instead of Bootstrap classes.
- Update `hideLoginModal` logic in `bootstrap.js` to use Shoelace's dialog API.

### Out of Scope
- Replacing JustGage logic for sensor visualization.
- Modifying Firebase Realtime Database schema or authentication logic.
- Adding new features or sensors.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `dashboard-ui`: Transitioning UI library from Bootstrap to Shoelace components, updating layout to CSS Grid/Flexbox, replacing icons, and adapting login modal interaction.

## Approach
1. Include Shoelace CSS and JS via CDN in `index.html`.
2. Remove Bootstrap and FontAwesome CDN links.
3. Refactor HTML structure:
   - Convert navbar elements.
   - Replace `<div class="modal">` with `<sl-dialog>`.
   - Update buttons and inputs inside the form.
   - Wrap `<article class="card">` elements in `<sl-card>`.
   - Update `<i class="fa-*">` tags to `<sl-icon name="*">`.
4. Update `scripts/app/bootstrap.js` to handle `sl-dialog.hide()` instead of the Bootstrap Modal API.
5. Update `style.css` to handle grid layouts previously managed by Bootstrap containers and grids.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `main/public/index.html` | Modified | Replacing Bootstrap/FA classes with Shoelace web components. |
| `main/public/style.css` | Modified | Adding layout rules to replace Bootstrap grid classes. |
| `main/public/scripts/app/bootstrap.js` | Modified | Updating modal close logic for Shoelace dialog. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| UI regression during layout translation | Medium | Use standard CSS Grid for cards and Flexbox for navbar, closely matching original layout visually. |
| JustGage compatibility with Web Components | Low | JustGage attaches to an ID; as long as the container is a light DOM child of `sl-card`, it will work. |

## Rollback Plan
Revert changes to `index.html`, `style.css`, and `bootstrap.js` via git. Ensure CDN links for Bootstrap and FontAwesome are restored.

## Dependencies
- Shoelace Web Components (via CDN).

## Success Criteria
- [ ] User can log in/out using the new Shoelace dialog.
- [ ] Dashboard displays properly with Shoelace cards replacing Bootstrap ones.
- [ ] Icons render correctly using Shoelace icons.
- [ ] Console shows no errors from missing Bootstrap dependencies.