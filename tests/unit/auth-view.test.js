import { describe, expect, test } from '@jest/globals';

import { createAuthView } from '../../main/public/scripts/ui/auth-view.js';

describe('createAuthView', () => {
  test('shows authenticated sections only for signed-in users', () => {
    document.body.innerHTML = `
      <sl-button data-auth="logged-out">Ingreso</sl-button>
      <sl-button data-auth="logged-in" hidden>Salir</sl-button>
      <section data-visibility="anonymous">Anon</section>
      <sl-card data-visibility="authenticated" hidden>Auth</sl-card>
    `;

    const view = createAuthView({ document });

    view.render({ uid: 'user-1' });

    expect(document.querySelector('[data-auth="logged-out"]').hidden).toBe(true);
    expect(document.querySelector('[data-auth="logged-in"]').hidden).toBe(false);
    expect(document.querySelector('[data-visibility="anonymous"]').hidden).toBe(true);
    expect(document.querySelector('[data-visibility="authenticated"]').hidden).toBe(false);
  });

  test('restores anonymous view after logout', () => {
    document.body.innerHTML = `
      <sl-button data-auth="logged-out" hidden>Ingreso</sl-button>
      <sl-button data-auth="logged-in">Salir</sl-button>
      <sl-dialog data-visibility="anonymous" hidden>Anon</sl-dialog>
      <sl-card data-visibility="authenticated">Auth</sl-card>
    `;

    const view = createAuthView({ document });

    view.render(null);

    expect(document.querySelector('[data-auth="logged-out"]').hidden).toBe(false);
    expect(document.querySelector('[data-auth="logged-in"]').hidden).toBe(true);
    expect(document.querySelector('[data-visibility="anonymous"]').hidden).toBe(false);
    expect(document.querySelector('[data-visibility="authenticated"]').hidden).toBe(true);
  });
});
