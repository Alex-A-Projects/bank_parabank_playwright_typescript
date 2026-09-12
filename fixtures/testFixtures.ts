import { test as base, expect, Page } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { LoginPanel } from '../pages/LoginPanel';
import { AccountOverviewPage } from '../pages/AccountOverviewPage';
import { ValidCustomer, AccountTypes } from '../utils/testData';
import { BasePage } from '../pages/BasePage';

/**
 * Custom test fixtures:
 *
 *   `homePage`             - the unauthenticated HomePage object.
 *   `loginPanel`           - inline login helper.
 *   `authenticatedPage`    - a Page that has already been logged in.
 *   `seededAuthedPage`     - logged in + demo data reseeded via /admin.htm INIT.
 *   `overviewPage`         - convenience POM for the post-login landing page.
 *   `seededOverviewPage`   - same, after seeding demo data.
 *
 * Important: fixtures never call `test.skip()`. They run the operation
 * and let the caller's assertions decide pass vs fail.
 */

async function seedDemoData(page: Page): Promise<void> {
  await page.goto(`${BasePage.BASE_URL}/admin.htm`);
  const initButton = page.locator('button[name="action"][value="INIT"]');
  if (await initButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await initButton.click();
    await page.waitForLoadState('load').catch(() => undefined);
  }
  await page.goto(`${BasePage.BASE_URL}/overview.htm`);
}

type ParaBankFixtures = {
  homePage: HomePage;
  loginPanel: LoginPanel;
  authenticatedPage: Page;
  seededAuthedPage: Page;
  overviewPage: AccountOverviewPage;
  seededOverviewPage: AccountOverviewPage;
};

export const test = base.extend<ParaBankFixtures>({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await homePage.open();
    await use(homePage);
  },

  loginPanel: async ({ page }, use) => {
    await use(new LoginPanel(page));
  },

  authenticatedPage: async ({ page }, use) => {
    const home = new HomePage(page);
    await home.open();
    await home.login(ValidCustomer.username, ValidCustomer.password);
    await use(page);
  },

  seededAuthedPage: async ({ page }, use) => {
    const home = new HomePage(page);
    await home.open();
    await home.login(ValidCustomer.username, ValidCustomer.password);
    await seedDemoData(page);
    await use(page);
  },

  overviewPage: async ({ authenticatedPage }, use) => {
    const overview = new AccountOverviewPage(authenticatedPage);
    await use(overview);
  },

  seededOverviewPage: async ({ seededAuthedPage }, use) => {
    const overview = new AccountOverviewPage(seededAuthedPage);
    await use(overview);
  },
});

export { expect };

// Re-export account-type helpers for convenience
export { AccountTypes };
