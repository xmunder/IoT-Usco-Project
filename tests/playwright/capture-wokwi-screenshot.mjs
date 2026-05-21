import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const rootDir = fileURLToPath(new URL('../../', import.meta.url));
const outputDir = path.join(rootDir, 'docs', 'screenshots');
const wokwiUrl = 'https://wokwi.com/projects/462695057941853185';

async function main() {
  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1200 }
  });

  await page.goto(wokwiUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  await page.screenshot({
    path: path.join(outputDir, 'wokwi-project.png'),
    fullPage: true
  });

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
