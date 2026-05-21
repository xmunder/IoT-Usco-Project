# Exploration: modernize-ui-shoelace

## Current State

El dashboard usa Bootstrap 5.2.3 (CDN) como única librería de componentes UI. La arquitectura fue modularizada en el cambio anterior (`revive-iot-dashboard`) y quedó bien separada:

- **`main.js`** — entry point, llama `bootstrapDashboard()`
- **`scripts/app/bootstrap.js`** — orquesta auth, gauges, sensors; referencia al DOM vía `document` inyectado
- **`scripts/app/dashboard-controller.js`** — controlador de estado
- **`scripts/ui/auth-view.js`** — toggle de visibilidad por `data-auth` / `data-visibility` attrs
- **`scripts/ui/gauge-manager.js`** — renderiza gauges JustGage + lecturas de sensores
- **`scripts/showmessage.js`** — wrapper de Toastify JS

Bootstrap se usa para:
1. **Navbar** — clase `navbar`, `navbar-expand-lg`, `container`
2. **Modal de login** — `modal fade`, `modal-dialog`, `modal-content`, `btn-close`, `form-control`, `btn btn-primary`
3. **`bootstrap.Modal` JS API** — `getOrCreateInstance` / `hide()` en `bootstrap.js`

Las cards, gauges y power control son **CSS custom** (no Bootstrap).

Los `data-*` attributes (`data-auth`, `data-visibility`, `data-sensor-value`, `data-power-indicator`, `data-toggle-status`) son contratos puros de la lógica JS — independientes de la UI library.

## Affected Areas

- `main/public/index.html` — marcado HTML donde viven los componentes Bootstrap (navbar, modal, buttons)
- `main/public/style.css` — CSS custom (cards, layout, power control) — bajo acoplamiento con Bootstrap
- `main/public/scripts/app/bootstrap.js` — usa `globalThis.bootstrap.Modal` para cerrar el modal post-login
- `main/public/scripts/showmessage.js` — usa Toastify; candidato a reemplazar con `sl-alert`

## Approaches

### 1. Additive — Shoelace en paralelo con Bootstrap (coexistencia)

Incorporar Shoelace vía CDN y reemplazar **solo los componentes visuales clave** manteniendo Bootstrap en paralelo durante transición. Ideal para iterar componente a componente.

- **Pros**: riesgo mínimo; rollback trivial por componente; no rompe lógica existente; se puede hacer incrementalmente por sprint
- **Cons**: dos librerías en CDN simultáneamente (+100 KB); CSS variables pueden colisionar; potencial conflicto de estilos en botones/inputs
- **Effort**: Low

### 2. Replace Bootstrap Modal → `<sl-dialog>` + Navbar → `<sl-button>`

Reemplazar el modal de login con `<sl-dialog>` y los botones del navbar con `<sl-button>`. La lógica JS de autenticación no cambia — solo cambia el marcado HTML y el API de apertura/cierre del dialog.

Cambios necesarios:
- `index.html`: reemplazar `div.modal.fade` → `<sl-dialog>`, botones navbar → `<sl-button>`
- `bootstrap.js`: reemplazar `globalThis.bootstrap.Modal.getOrCreateInstance(...).hide()` → `dialog.hide()` (sl-dialog API)
- Eliminar Bootstrap JS (`bootstrap.bundle.min.js`) y su CSS
- Mantener Shoelace CDN

- **Pros**: elimina Bootstrap completamente; Shoelace es web components nativos (shadow DOM, accesibilidad integrada); CSS variables del design system
- **Cons**: cambio de API del modal requiere tocar `bootstrap.js`; `sl-dialog` usa distinto modelo de apertura (atributo `open` vs JS)
- **Effort**: Medium

### 3. Full Shoelace — Reemplazar también Toastify con `<sl-alert>`

Mismo que opción 2, más reemplazar `showmessage.js` usando `<sl-alert>` con `toast()` API nativa de Shoelace.

- **Pros**: una sola librería UI; notificaciones consistentes con el design system; elimina Toastify CDN
- **Cons**: `sl-alert.toast()` requiere que el elemento esté en el DOM; patrón ligeramente distinto al wrapper actual (necesita refactor de `showmessage.js`)
- **Effort**: Medium

### 4. Progressive Enhancement — Solo reemplazar cards con `<sl-card>`

Reemplazar las `.card` custom con `<sl-card>` de Shoelace, manteniendo Bootstrap para modal y botones.

- **Pros**: mejora visual inmediata; mínimo impacto en lógica
- **Cons**: Bootstrap sigue en bundle; menor ganancia en consistencia; las cards actuales tienen poco problema visual
- **Effort**: Low

## Recommendation

**Opción 2 + 3 combinadas** (replace completo, Bootstrap out, Shoelace in) en una sola pasada.

Justificación:
- El frontend es pequeño (1 HTML, 1 CSS, pocos módulos JS) — no hay riesgo de regresión masiva
- La lógica JS está bien desacoplada del DOM: los `data-*` attrs no dependen de Bootstrap, solo `bootstrap.js` tiene una dependencia directa en `globalThis.bootstrap.Modal` — es un cambio puntual de ≤5 líneas
- `showmessage.js` es un wrapper de una sola función — refactorizarlo con `sl-alert` es trivial
- Eliminar Bootstrap evita el CSS conflict risk permanentemente y reduce el bundle CDN
- Shoelace usa Web Components + CSS custom properties → integración limpia con vanilla JS, no requiere build step

**Secuencia recomendada**:
1. Agregar Shoelace CDN (autoloader vía ESM)
2. Reemplazar navbar buttons → `<sl-button>`
3. Reemplazar modal login → `<sl-dialog>` + actualizar `bootstrap.js`
4. Reemplazar `showmessage.js` → `sl-alert` toast
5. Reemplazar `.card` → `<sl-card>` (opcional pero recomendado para coherencia)
6. Eliminar Bootstrap CSS + JS del `<head>`
7. Eliminar Toastify CDN
8. Ajustar `style.css` (layout/nav/colors siguen custom; Shoelace tiene CSS vars para theming)

## Risks

- **`sl-dialog` API vs Bootstrap Modal**: `sl-dialog` usa el atributo `open` para mostrarse y el método `.hide()` para cerrarse. En `bootstrap.js` hay lógica de fallback (`getOrCreateInstance` / `getInstance`) que debe reemplazarse con una sola línea: `loginModal?.hide()`. Bajo riesgo.
- **Shadow DOM en tests**: Los tests actuales con jsdom no pueden penetrar shadow DOM de Web Components. Si hay tests sobre elementos de la UI de Bootstrap (inputs del modal), esos tests necesitarán ajuste o mocking. Riesgo medio si el test suite cubre el modal.
- **FontAwesome + Shoelace icons**: Shoelace tiene su propio sistema de íconos (`<sl-icon>`). Coexistencia con FontAwesome es posible pero puede generar inconsistencia visual. Decisión de diseño a tomar en proposal.
- **Theming**: El color primario del proyecto es `#8F141B` (rojo USCO). Shoelace permite theming completo vía CSS vars (`--sl-color-primary-*`). Hay que definir el theme en el diseño.
- **CDN load order**: Shoelace autoloader es ESM async; si JustGage o Raphael se cargan de forma síncrona antes que Shoelace, no hay conflicto. Verificar que el `<script type="module">` de main.js se ejecute después de que Shoelace registre los custom elements.

## Ready for Proposal

**Sí.** El alcance está claro, el riesgo es bajo-medio, y los cambios en lógica JS son puntuales (≤10 líneas en `bootstrap.js`, refactor menor en `showmessage.js`). El resto son cambios en `index.html` y `style.css`.
