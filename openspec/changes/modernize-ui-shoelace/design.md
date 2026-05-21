# Design: modernize-ui-shoelace

## Technical Approach

Modernizar la capa visual del dashboard sin tocar Firebase, controladores ni JustGage. La implementación reemplaza Bootstrap y FontAwesome en `main/public/index.html` por Shoelace vía CDN, conserva la estructura de datos actual y mueve el layout a CSS propio en `main/public/style.css`. `main/public/scripts/app/bootstrap.js` solo cambia en la interacción del login para abrir/cerrar `sl-dialog` sin introducir acoplamiento nuevo.

## Architecture Decisions

| Decision | Options | Choice | Rationale |
|---|---|---|---|
| Carga de Shoelace | npm/bundling vs CDN | CDN versionado + autoloader | El proyecto es HTML/CSS/JS vanilla y hoy ya depende de CDN; esto minimiza impacto y evita pipeline nuevo. |
| Reemplazo de componentes | Reescribir todo en custom elements propios vs usar Shoelace puntual | `sl-button`, `sl-dialog`, `sl-input`, `sl-card`, `sl-icon` | Cubre login, acciones y cards con accesibilidad nativa y menor esfuerzo. |
| Theming | CSS ad-hoc por selector vs tokens globales | CSS vars de Shoelace en `:root` + clases existentes | Permite mantener identidad USCO y reducir overrides frágiles sobre shadow parts. |
| Integración modal | API Bootstrap vs API nativa Shoelace | `dialog.show()`/`dialog.hide()` desde DOM | Elimina dependencia a `globalThis.bootstrap` y mantiene el flujo actual del submit. |
| Compatibilidad de gauges | Mover gauge dentro de shadow DOM vs conservar light DOM | Mantener `<div id="gauge-*">` como hijo light DOM dentro de `sl-card` | JustGage busca IDs y renderiza con Raphael sobre nodos reales; así evitamos romperlo. |

## Data Flow

```text
index.html
  ├─ carga Shoelace CSS + shoelace-autoloader
  ├─ define sl-dialog/sl-card/sl-button/sl-input/sl-icon
  └─ carga main.js
           └─ bootstrapDashboard()
                ├─ createAuthView() alterna hidden por data-auth/data-visibility
                ├─ submit login -> firebaseClient.signIn()
                ├─ éxito -> hideLoginModal() => sl-dialog.hide()
                └─ controller.start(user) -> gaugeManager.render()
                                           └─ JustGage refresca en #gauge-*
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `openspec/changes/modernize-ui-shoelace/design.md` | Create | Diseño técnico del cambio. |
| `main/public/index.html` | Modify | Quitar Bootstrap/FontAwesome; agregar Shoelace CDN; reemplazar modal/navbar/cards/icons; preservar IDs, `data-*` y contenedores `gauge-*`. |
| `main/public/style.css` | Modify | Reemplazar dependencias implícitas de Bootstrap con flex/grid propios; declarar tokens Shoelace (`--sl-color-primary-*`, radios, spacing) y estilos de layout. |
| `main/public/scripts/app/bootstrap.js` | Modify | Adaptar `hideLoginModal()` y opcionalmente el click de ingreso para usar `sl-dialog`. Mantener firmas públicas. |
| `tests/integration/bootstrap.test.js` | Modify | Mockear `sl-dialog` con método `hide()` en vez de `bootstrap.Modal`. |
| `tests/unit/auth-view.test.js` | Modify | Verificar que toggles por `hidden` sigan funcionando con markup Shoelace. |
| `tests/unit/gauge-manager.test.js` | Modify | Añadir caso con `sl-card`/contenedor visible para confirmar que JustGage sigue operando en light DOM. |

## Interfaces / Contracts

No se agregan APIs nuevas. Se preservan estos contratos:

- `#login-form`, `#login-email`, `#login-password`, `#logout`, `#login-button`
- `[data-auth]` y `[data-visibility]` usados por `auth-view.js`
- `#gauge-*` y `[data-sensor-value="*"]` usados por `gauge-manager.js`

Patrón no obvio en `bootstrap.js`:

```js
function hideLoginModal(loginForm) {
  const dialog = loginForm?.closest?.('sl-dialog');
  dialog?.hide?.();
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Login close behavior sin Bootstrap | Testear helper sobre un `sl-dialog` mockeado en jsdom. |
| Unit | Auth visibility | Reusar `hidden` assertions con nuevo markup Shoelace. |
| Unit | Gauge compatibility | Confirmar que `createGaugeManager()` refresca gauges dentro de `sl-card` y sigue postergando render si un ancestro está `hidden`. |
| Integration | Bootstrap completo | Validar login/logout, mensajes y cierre de diálogo. |
| E2E | N/A | No hay infraestructura E2E actual; se difiere. |

## Migration / Rollout

No migration required. El rollout es directo en frontend estático: actualizar HTML/CSS/JS y validar visualmente login, dashboard autenticado y gauges.

## Open Questions

- [ ] Definir versión exacta de Shoelace CDN a fijar para evitar cambios implícitos.
- [ ] Confirmar si el botón `Ingreso` abrirá el diálogo por `dialog.show()` manual o por atributo `hoist` + listener dedicado; ambas opciones son viables, pero conviene estandarizar una sola.
