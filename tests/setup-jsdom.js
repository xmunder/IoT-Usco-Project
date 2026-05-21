import { afterEach, beforeEach, jest } from '@jest/globals';

beforeEach(() => {
  document.body.innerHTML = '';
  delete globalThis.bootstrap;
  delete globalThis.Toastify;
  delete globalThis.JustGage;
  jest.restoreAllMocks();
});

afterEach(() => {
  document.body.innerHTML = '';
});
