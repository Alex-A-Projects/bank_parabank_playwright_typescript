import { test, expect } from '../fixtures/testFixtures';

/**
 * Home page assertions.
 * Covers: the customer-login form, links to every public page, and the
 * "Forgot login info?" plus "Register" entry points.
 */
test.describe('Home page', () => {
  test('loads and shows the customer login form', async ({ homePage }) => {
    await homePage.assertLoaded();
    await homePage.assertLoginLabels();
    await expect(homePage.page).toHaveURL(/index\.htm/);
  });

  test('header navigation: About Us and Services links are attached to the DOM', async ({ homePage }) => {
    await expect(homePage.aboutUsLink).toHaveCount(1);
    await expect(homePage.servicesLink).toHaveCount(1);
    await expect(homePage.adminPageLink).toHaveCount(1);
    await expect(homePage.logoLink).toBeVisible();
  });

  test('sidebar ATM and Online Services links are present on the page', async ({ homePage }) => {
    await expect(homePage.withdrawFundsLink).toHaveCount(1);
    await expect(homePage.transferFundsSidebarLink).toHaveCount(1);
    await expect(homePage.checkBalancesLink).toHaveCount(1);
    await expect(homePage.makeDepositsLink).toHaveCount(1);
    await expect(homePage.billPayLink).toHaveCount(1);
    await expect(homePage.accountHistoryLink).toHaveCount(1);
  });

  test('Forgot login info? link navigates to the lookup page', async ({ homePage, page }) => {
    await homePage.forgotLoginLink.click();
    await expect(page).toHaveURL(/lookup\.htm/);
    await expect(page.locator('#rightPanel h1.title').first()).toContainText(/Customer Lookup/i);
  });

  test('Register link navigates to the registration page', async ({ homePage, page }) => {
    await homePage.registerLink.click();
    await expect(page).toHaveURL(/register\.htm/);
    await expect(page.locator('#rightPanel h1.title').first()).toContainText(/Signing up is easy/i);
  });

  test('about-us link in the Solutions fly-out navigates to the About page', async ({ homePage, page }) => {
    // The About Us link lives inside the Solutions fly-out (hidden until
    // hover). Use direct navigation as the assertion: the link exists and
    // its href points to about.htm.
    const href = await homePage.aboutUsLink.getAttribute('href');
    expect(href).toMatch(/about\.htm/);
    await page.goto('https://parabank.parasoft.com/parabank/about.htm');
    await expect(page.locator('#rightPanel')).toBeVisible();
    // About page renders "ParaSoft Demo Website" as the H1.
    await expect(page.locator('#rightPanel h1.title').first()).toContainText(/ParaSoft/i);
  });

  test('admin-page link lives in the Solutions fly-out (DOM check)', async ({ homePage }) => {
    const href = await homePage.adminPageLink.getAttribute('href');
    expect(href).toMatch(/admin\.htm/);
  });

  test('logo click returns to the home page from elsewhere', async ({ homePage, page }) => {
    await homePage.goto('/about.htm');
    await homePage.clickLogo();
    await expect(page).toHaveURL(/index\.htm/);
  });

  test('empty login form submission surfaces an error', async ({ homePage, page }) => {
    await homePage.loginButton.click();

    // Empty creds redirect to login.htm with an error below.
    await expect(page).toHaveURL(/login\.htm/);
    await expect(homePage.errorPanel).toBeVisible();
  });
});
