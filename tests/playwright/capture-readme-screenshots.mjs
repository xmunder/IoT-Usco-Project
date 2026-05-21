import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

import { gotoDashboard, openLoginDialog, submitLogin } from './helpers/browser-mocks.js';

const rootDir = fileURLToPath(new URL('../../', import.meta.url));
const outputDir = path.join(rootDir, 'docs', 'screenshots');
const host = '127.0.0.1';
const port = '4173';
const baseUrl = `http://${host}:${port}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, attempts = 40) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // Retry until server is ready.
    }

    await sleep(250);
  }

  throw new Error('No se pudo levantar el server estático para capturas.');
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const server = spawn('node', ['tests/playwright/server.mjs'], {
    cwd: rootDir,
    env: {
      ...process.env,
      PORT: port
    },
    stdio: 'inherit'
  });

  try {
    await waitForServer(baseUrl);

    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1200 },
      baseURL: baseUrl
    });

    await gotoDashboard(page, {
      authDelayMs: 0,
      initialUser: null,
      fallbackUser: {
        uid: 'readme-user',
        email: 'demo@usco.edu.co'
      }
    });

    await openLoginDialog(page);
    await page.screenshot({
      path: path.join(outputDir, 'login.png'),
      fullPage: true
    });

    await submitLogin(page, {
      email: 'demo@usco.edu.co',
      password: 'secret123'
    });

    await page.evaluate(() => {
      globalThis.__IOT_USCO_E2E__?.publishReading('temperature', 24.75);
      globalThis.__IOT_USCO_E2E__?.publishReading('humidity', 61.2);
      globalThis.__IOT_USCO_E2E__?.publishReading('distance', 18.4);
      globalThis.__IOT_USCO_E2E__?.publishReading('co2', 520);
      globalThis.__IOT_USCO_E2E__?.publishReading('alcohol', 12.4);
      globalThis.__IOT_USCO_E2E__?.publishReading('co', 8.3);
      globalThis.__IOT_USCO_E2E__?.setToggleStatus('ON');
    });

    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(outputDir, 'dashboard.png'),
      fullPage: true
    });

    await browser.close();
  } finally {
    server.kill('SIGTERM');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
