import { describe, expect, jest, test } from '@jest/globals';

import { showMessage } from '../../main/public/scripts/showmessage.js';

describe('showMessage', () => {
  test('creates a Shoelace alert toast for success messages', () => {
    const originalCreateElement = document.createElement.bind(document);
    const toast = jest.fn();

    jest.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
      const element = originalCreateElement(tagName, options);

      if (String(tagName).toLowerCase() === 'sl-alert') {
        element.toast = toast;
      }

      return element;
    });

    showMessage('Ingreso correcto.');

    const alert = document.body.querySelector('sl-alert');
    expect(alert).not.toBeNull();
    expect(alert.variant).toBe('success');
    expect(alert.closable).toBe(true);
    expect(alert.duration).toBe(3000);
    expect(alert.textContent).toContain('Ingreso correcto.');
    expect(toast).toHaveBeenCalledTimes(1);
  });

  test('falls back to console logging when Shoelace toast API is unavailable', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    showMessage('No se pudo iniciar sesión.', 'error');

    expect(errorSpy).toHaveBeenCalledWith('No se pudo iniciar sesión.');
    expect(document.body.querySelector('sl-alert')).toBeNull();
  });
});
