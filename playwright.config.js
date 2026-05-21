import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/playwright',
  fullyParallel: false,
  retries: 0,
  timeout: 30_000,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    viewport: {
      width: 1440,
      height: 960
    },
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'node ./tests/playwright/server.mjs',
    url: 'http://127.0.0.1:4173/health',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
