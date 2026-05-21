import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../../../', import.meta.url));
const shoelaceRoot = path.join(projectRoot, 'node_modules', '@shoelace-style', 'shoelace');

function getContentType(filePath) {
  switch (path.extname(filePath).toLowerCase()) {
    case '.css':
      return 'text/css; charset=utf-8';
    case '.js':
    case '.mjs':
      return 'application/javascript; charset=utf-8';
    case '.svg':
      return 'image/svg+xml; charset=utf-8';
    default:
      return 'application/octet-stream';
  }
}

async function fulfillWithFile(route, filePath) {
  const body = await readFile(filePath);
  await route.fulfill({
    status: 200,
    body,
    headers: {
      'cache-control': 'no-store',
      'content-type': getContentType(filePath)
    }
  });
}

async function fulfillShoelaceAsset(route) {
  const requestUrl = new URL(route.request().url());
  const relativeAssetPath = requestUrl.pathname.replace('/npm/@shoelace-style/shoelace@2.20.1/', '');
  const filePath = path.resolve(shoelaceRoot, relativeAssetPath);

  if (!filePath.startsWith(shoelaceRoot)) {
    await route.abort('accessdenied');
    return;
  }

  await fulfillWithFile(route, filePath);
}

async function installNetworkRoutes(page) {
  await page.route('**/main/public/config.js', async (route) => {
    await route.fulfill({
      status: 200,
      body: 'window.FIREBASE_CONFIG = window.FIREBASE_CONFIG || {};',
      headers: {
        'cache-control': 'no-store',
        'content-type': 'application/javascript; charset=utf-8'
      }
    });
  });

  await page.route('https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/**', fulfillShoelaceAsset);
}

export async function installBrowserMocks(page, options = {}) {
  await installNetworkRoutes(page);

  await page.addInitScript(
    ({ authDelayMs, fallbackUser, initialUser }) => {
      const state = {
        authCallbacks: [],
        authDelayMs,
        data: new Map(),
        fallbackUser,
        powerWrites: [],
        subscriptions: new Map(),
        user: initialUser,
        visibilitySnapshots: [],
        visibilityObserverStarted: false
      };

      const recordVisibility = (reason) => {
        const dashboard = document.querySelector('#dashboard-content');
        const landing = document.querySelector('.description-container');

        if (!dashboard || !landing) {
          return;
        }

        state.visibilitySnapshots.push({
          reason,
          dashboardHidden: dashboard.hidden,
          landingHidden: landing.hidden,
          userUid: state.user?.uid ?? null
        });
      };

      const startVisibilityObserver = () => {
        if (state.visibilityObserverStarted || !document.documentElement) {
          return;
        }

        state.visibilityObserverStarted = true;
        const observer = new MutationObserver((mutations) => {
          if (mutations.some((mutation) => mutation.attributeName === 'hidden')) {
            recordVisibility('hidden-mutation');
          }
        });

        observer.observe(document.documentElement, {
          subtree: true,
          attributes: true,
          attributeFilter: ['hidden']
        });

        recordVisibility('observer-ready');
      };

      const notifyAuthChange = () => {
        state.authCallbacks.forEach(({ callback }) => callback(state.user));
        recordVisibility('auth-change');
      };

      const emitReading = (path, value) => {
        state.data.set(path, value);
        const listeners = state.subscriptions.get(path) ?? [];
        listeners.forEach((listener) => listener(value, { val: () => value }));
      };

      if (document.documentElement) {
        startVisibilityObserver();
      } else {
        document.addEventListener('readystatechange', startVisibilityObserver, { once: true });
      }

      document.addEventListener('DOMContentLoaded', () => recordVisibility('dom-content-loaded'), { once: true });
      window.addEventListener('load', () => recordVisibility('window-load'), { once: true });

      globalThis.__IOT_USCO_E2E__ = {
        getPowerWrites() {
          return [...state.powerWrites];
        },
        getVisibilitySnapshots() {
          return [...state.visibilitySnapshots];
        },
        publishReading(sensorKey, value, uid = state.user?.uid ?? state.fallbackUser.uid) {
          emitReading(`UsersData/${uid}/${sensorKey}`, value);
        },
        setToggleStatus(value, uid = state.user?.uid ?? state.fallbackUser.uid) {
          emitReading(`UsersData/${uid}/toggleStatus/status`, value);
        },
        signIn(email = state.fallbackUser.email) {
          state.user = {
            ...state.fallbackUser,
            email
          };
          notifyAuthChange();
        },
        signOut() {
          state.user = null;
          notifyAuthChange();
        }
      };

      globalThis.__IOT_USCO_TEST_HOOKS__ = {
        async createFirebaseBrowserClient() {
          return {
            onAuthStateChanged(callback) {
              const entry = { callback };
              state.authCallbacks.push(entry);
              const timer = setTimeout(() => callback(state.user), state.authDelayMs);

              return () => {
                clearTimeout(timer);
                state.authCallbacks = state.authCallbacks.filter((candidate) => candidate !== entry);
              };
            },
            set(path, value) {
              state.data.set(path, value);
              state.powerWrites.push({ path, value });
              return Promise.resolve();
            },
            get(path) {
              return Promise.resolve(state.data.get(path) ?? null);
            },
            signIn(email) {
              state.user = {
                ...state.fallbackUser,
                email
              };
              notifyAuthChange();
              return Promise.resolve();
            },
            signOut() {
              state.user = null;
              notifyAuthChange();
              return Promise.resolve();
            },
            subscribe(path, onReading) {
              const listeners = state.subscriptions.get(path) ?? [];
              listeners.push(onReading);
              state.subscriptions.set(path, listeners);

              return () => {
                const nextListeners = (state.subscriptions.get(path) ?? []).filter((listener) => listener !== onReading);
                state.subscriptions.set(path, nextListeners);
              };
            }
          };
        }
      };
    },
    {
      authDelayMs: options.authDelayMs ?? 750,
      fallbackUser: options.fallbackUser ?? {
        uid: 'playwright-user',
        email: 'demo@usco.edu.co'
      },
      initialUser: options.initialUser ?? null
    }
  );
}

export async function waitForShoelaceReady(page) {
  await page.waitForFunction(() => {
    const dialog = document.querySelector('#login-dialog');
    return Boolean(
      customElements.get('sl-alert') &&
      customElements.get('sl-button') &&
      customElements.get('sl-card') &&
      customElements.get('sl-dialog') &&
      customElements.get('sl-input') &&
      dialog &&
      typeof dialog.show === 'function' &&
      typeof dialog.hide === 'function'
    );
  });
}

export async function gotoDashboard(page, options = {}) {
  await installBrowserMocks(page, options);
  await page.goto('/main/public/index.html');
  await waitForShoelaceReady(page);
}

export async function openLoginDialog(page) {
  await page.locator('#login-button').click();
  await page.waitForFunction(() => document.querySelector('#login-dialog')?.open === true);
}

export async function submitLogin(page, { email = 'demo@usco.edu.co', password = 'secret123' } = {}) {
  await page.evaluate(
    ({ email: nextEmail, password: nextPassword }) => {
      document.querySelector('#login-email').value = nextEmail;
      document.querySelector('#login-password').value = nextPassword;
    },
    { email, password }
  );

  await page.locator('.login-form__submit').click();
  await page.waitForFunction(() => document.querySelector('#login-dialog')?.open === false);
}
