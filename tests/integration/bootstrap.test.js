import { describe, expect, jest, test } from '@jest/globals';

import { bootstrapDashboard } from '../../main/public/scripts/app/bootstrap.js';

describe('bootstrapDashboard', () => {
  test('wires auth lifecycle plus login/logout handlers without Bootstrap modal APIs', async () => {
    document.body.innerHTML = `
      <sl-button id="login-button" type="button" data-auth="logged-out">Ingreso</sl-button>
      <sl-dialog id="login-dialog">
        <form id="login-form">
          <sl-input id="login-email" type="email"></sl-input>
          <sl-input id="login-password" type="password"></sl-input>
        </form>
      </sl-dialog>
      <sl-button id="logout" type="button" data-auth="logged-in">Salir</sl-button>
    `;

    const bootstrapGetter = jest.fn(() => {
      throw new Error('Bootstrap modal API should not be accessed');
    });
    Object.defineProperty(globalThis, 'bootstrap', {
      configurable: true,
      get: bootstrapGetter
    });

    const loginDialog = document.querySelector('sl-dialog');
    const hide = jest.fn();
    const show = jest.fn();
    loginDialog.hide = hide;
    loginDialog.show = show;

    document.querySelector('#login-email').value = 'demo@usco.edu.co';
    document.querySelector('#login-password').value = 'secret123';

    let authCallback = () => {};
    const unsubscribeAuth = jest.fn();
    const firebaseClient = {
      onAuthStateChanged: jest.fn((callback) => {
        authCallback = callback;
        return unsubscribeAuth;
      }),
      signIn: jest.fn().mockResolvedValue(undefined),
      signOut: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
      set: jest.fn()
    };
    const authView = { render: jest.fn() };
    const gaugeManager = { render: jest.fn(), renderAllFallback: jest.fn() };
    const controller = { start: jest.fn(), dispose: jest.fn() };
    const showMessage = jest.fn();

    const app = await bootstrapDashboard({
      document,
      firebaseClientFactory: async () => firebaseClient,
      authViewFactory: () => authView,
      gaugeManagerFactory: () => gaugeManager,
      sensorRepositoryFactory: () => ({
        subscribe: jest.fn(),
        setToggleStatus: jest.fn()
      }),
      dashboardControllerFactory: () => controller,
      showMessage
    });

    document.querySelector('#login-button').click();
    expect(show).toHaveBeenCalled();

    authCallback({ uid: 'user-1' });
    expect(controller.start).toHaveBeenCalledWith({ uid: 'user-1' });

    document.querySelector('#login-form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
    await Promise.resolve();

    expect(firebaseClient.signIn).toHaveBeenCalledWith('demo@usco.edu.co', 'secret123');
    expect(showMessage).toHaveBeenCalledWith('Ingreso correcto.');
    expect(hide).toHaveBeenCalled();

    document.querySelector('#logout').click();
    await Promise.resolve();

    expect(firebaseClient.signOut).toHaveBeenCalled();
    expect(showMessage).toHaveBeenCalledWith('Sesión cerrada correctamente.');
    expect(bootstrapGetter).not.toHaveBeenCalled();

    app.dispose();
    delete globalThis.bootstrap;

    expect(unsubscribeAuth).toHaveBeenCalled();
    expect(controller.dispose).toHaveBeenCalled();
  });
});
