import { expect, test } from '@playwright/test';

import { gotoDashboard, openLoginDialog, submitLogin } from './helpers/browser-mocks.js';

test.describe('dashboard smoke (Playwright)', () => {
  test('keeps the anonymous landing visible without exposing the dashboard before login', async ({ page }) => {
    await gotoDashboard(page, { authDelayMs: 1_200 });

    await expect(page.locator('.description-container')).toBeVisible();
    await expect(page.locator('#dashboard-content')).toBeHidden();
    await expect(page.locator('#login-button')).toBeVisible();
    await expect(page.locator('#logout')).toBeHidden();
    await expect(page.locator('#gauge-temperature svg')).toHaveCount(0);

    await page.waitForTimeout(1_300);
    await expect(page.locator('#dashboard-content')).toBeHidden();

    const visibilitySnapshots = await page.evaluate(() => globalThis.__IOT_USCO_E2E__.getVisibilitySnapshots());
    expect(
      visibilitySnapshots.some(
        (snapshot) => snapshot.dashboardHidden === false && snapshot.landingHidden === false && snapshot.userUid === null
      )
    ).toBe(false);
  });

  test('opens and closes the Shoelace login dialog in a real browser', async ({ page }) => {
    await gotoDashboard(page);
    await openLoginDialog(page);

    await expect(page.locator('#login-dialog')).toHaveJSProperty('open', true);
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.locator('#login-dialog')).toHaveJSProperty('open', false);
  });

  test('reveals the authenticated dashboard layout and renders real gauges after sign-in', async ({ page }) => {
    await gotoDashboard(page);
    await openLoginDialog(page);
    await submitLogin(page);

    await expect(page.locator('#dashboard-content')).toBeVisible();
    await expect(page.locator('.description-container')).toBeHidden();
    await expect(page.locator('#logout')).toBeVisible();
    await expect(page.locator('#login-button')).toBeHidden();

    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.querySelector('.site-header__inner')).display))
      .toBe('flex');
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.querySelector('.dashboard-grid')).display))
      .toBe('grid');

    const desktopColumnCount = await page.evaluate(() => {
      const columns = getComputedStyle(document.querySelector('.dashboard-grid')).gridTemplateColumns;
      return columns.split(' ').filter(Boolean).length;
    });

    expect(desktopColumnCount).toBeGreaterThan(1);

    await page.evaluate(() => globalThis.__IOT_USCO_E2E__.publishReading('temperature', 26.5));

    await expect(page.locator('[data-sensor-value="temperature"]')).toHaveText('26.50');
    await expect(page.locator('#gauge-temperature svg')).toHaveCount(1);
  });
});
