import { createFirebaseBrowserClient } from '../firebase.js';
import { SENSOR_DEFINITIONS } from '../shared/sensor-definitions.js';
import { createSensorRepository } from '../services/sensor-repository.js';
import { showMessage as defaultShowMessage } from '../showmessage.js';
import { createAuthView } from '../ui/auth-view.js';
import { createGaugeManager } from '../ui/gauge-manager.js';
import { createDashboardController } from './dashboard-controller.js';

const AUTH_ERROR_MESSAGES = Object.freeze({
  'auth/wrong-password': 'Contraseña incorrecta.',
  'auth/user-not-found': 'Usuario no encontrado.',
  'auth/invalid-credential': 'Credenciales inválidas.',
  'auth/invalid-login-credentials': 'Credenciales inválidas.'
});

function getAuthErrorMessage(error) {
  return AUTH_ERROR_MESSAGES[error?.code] ?? error?.message ?? 'No se pudo iniciar sesión.';
}

function showLoginDialog(dialog) {
  if (!dialog) {
    return;
  }

  if (typeof dialog.show === 'function') {
    dialog.show();
    return;
  }

  dialog.setAttribute?.('open', '');
}

function hideLoginModal(loginForm) {
  const dialog = loginForm?.closest?.('sl-dialog');

  if (!dialog) {
    return;
  }

  if (typeof dialog.hide === 'function') {
    dialog.hide();
    return;
  }

  dialog.removeAttribute?.('open');
}

function resetLoginForm(loginForm) {
  loginForm?.reset?.();

  const emailInput = loginForm?.querySelector?.('#login-email');
  const passwordInput = loginForm?.querySelector?.('#login-password');

  if (emailInput) {
    emailInput.value = '';
  }

  if (passwordInput) {
    passwordInput.value = '';
  }
}

export async function bootstrapDashboard({
  document = globalThis.document,
  sensorDefinitions = SENSOR_DEFINITIONS,
  firebaseClientFactory = createFirebaseBrowserClient,
  authViewFactory = createAuthView,
  gaugeManagerFactory = createGaugeManager,
  sensorRepositoryFactory = createSensorRepository,
  dashboardControllerFactory = createDashboardController,
  showMessage = defaultShowMessage
} = {}) {
  const firebaseClient = await firebaseClientFactory();
  const authView = authViewFactory({ document });
  const gaugeManager = gaugeManagerFactory({ document, definitions: sensorDefinitions });
  const sensorRepository = sensorRepositoryFactory(firebaseClient);
  const controller = dashboardControllerFactory({
    document,
    authView,
    gaugeManager,
    sensorRepository,
    sensorDefinitions,
    showMessage
  });

  authView.render(null);

  const disposers = [];
  const loginForm = document?.querySelector?.('#login-form');
  const loginButton = document?.querySelector?.('#login-button');
  const logoutButton = document?.querySelector?.('#logout');

  if (loginButton && loginForm) {
    const loginDialog = loginForm.closest?.('sl-dialog');

    const onOpenLogin = (event) => {
      event.preventDefault();
      showLoginDialog(loginDialog);
    };

    loginButton.addEventListener('click', onOpenLogin);
    disposers.push(() => loginButton.removeEventListener('click', onOpenLogin));
  }

  if (loginForm) {
    const onSubmit = async (event) => {
      event.preventDefault();

      const email = loginForm.querySelector('#login-email')?.value?.trim() ?? '';
      const password = loginForm.querySelector('#login-password')?.value ?? '';

      if (!email || !password) {
        showMessage('Completá email y contraseña.', 'error');
        return;
      }

      try {
        await firebaseClient.signIn(email, password);
        showMessage('Ingreso correcto.');
        hideLoginModal(loginForm);
        resetLoginForm(loginForm);
      } catch (error) {
        showMessage(getAuthErrorMessage(error), 'error');
      }
    };

    loginForm.addEventListener('submit', onSubmit);
    disposers.push(() => loginForm.removeEventListener('submit', onSubmit));
  }

  if (logoutButton) {
    const onLogout = async (event) => {
      event.preventDefault();

      try {
        await firebaseClient.signOut();
        showMessage('Sesión cerrada correctamente.');
      } catch (error) {
        showMessage(error?.message ?? 'No se pudo cerrar la sesión.', 'error');
      }
    };

    logoutButton.addEventListener('click', onLogout);
    disposers.push(() => logoutButton.removeEventListener('click', onLogout));
  }

  const unsubscribeAuth = firebaseClient.onAuthStateChanged((user) => {
    controller.start(user);
  });
  disposers.push(() => unsubscribeAuth?.());

  return {
    dispose() {
      while (disposers.length > 0) {
        disposers.pop()?.();
      }

      controller.dispose?.();
    }
  };
}
