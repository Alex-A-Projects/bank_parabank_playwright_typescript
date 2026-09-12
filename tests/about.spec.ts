import { test, expect } from '../fixtures/testFixtures';
import { AboutPage } from '../pages/AboutPage';

test.describe('About page', () => {
  test('navigates from home and shows the about content', async ({ homePage, page }) => {
    await homePage.aboutUsLink.click();
    const about = new AboutPage(page);
    await about.assertLoaded();
    await expect(about.logoLink).toBeVisible();
    await expect(about.footerHomeLink).toBeVisible();
    await expect(about.footerContactLink).toBeVisible();
  });

  test('deep link loads directly', async ({ page }) => {
    const about = new AboutPage(page);
    await about.open();
    await about.assertLoaded();
  });

  test('page title contains ParaBank', async ({ page }) => {
    const about = new AboutPage(page);
    await about.open();
    await expect(page).toHaveTitle(/ParaBank/);
  });

  test('heading reads "ParaSoft Demo Website"', async ({ page }) => {
    const about = new AboutPage(page);
    await about.open();
    await expect(about.bodyHeading).toHaveText(/ParaSoft Demo Website/i);
  });

  test('the about copy explicitly states it is not a real bank', async ({ page }) => {
    const about = new AboutPage(page);
    await about.open();
    await expect(page.locator('#rightPanel')).toContainText(/not a real bank/i);
  });

  test('global ParaBank logo is visible on the about page', async ({ page }) => {
    const about = new AboutPage(page);
    await about.open();
    await expect(about.logoLink).toBeVisible();
  });

  test('header still exposes the Solutions menu items', async ({ page }) => {
    const about = new AboutPage(page);
    await about.open();
    await expect(page.locator('#headerPanel a[href*="about.htm"]').first()).toHaveCount(1);
    await expect(page.locator('#headerPanel a[href*="services.htm"]').first()).toHaveCount(1);
    await expect(page.locator('#headerPanel a[href*="admin.htm"]').first()).toHaveCount(1);
  });

  test('header breadcrumb shows home / about / contact', async ({ page }) => {
    const about = new AboutPage(page);
    await about.open();
    const breadcrumb = page.locator('ul.button').first();
    await expect(breadcrumb).toContainText('home');
    await expect(breadcrumb).toContainText('about');
    await expect(breadcrumb).toContainText('contact');
  });

  test('the customer-login panel is also present on the about page', async ({ page }) => {
    const about = new AboutPage(page);
    await about.open();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[value="Log In"]')).toBeVisible();
    await expect(page.locator('a[href*="register.htm"]').first()).toBeVisible();
  });

  test('clicking the ParaBank logo from About navigates back home', async ({ page }) => {
    const about = new AboutPage(page);
    await about.open();
    await about.clickLogo();
    await expect(page).toHaveURL(/index\.htm/);
  });

  test('the About Us header link points to about.htm', async ({ page }) => {
    const about = new AboutPage(page);
    await about.open();
    const href = await about.aboutUsLink.getAttribute('href');
    expect(href).toMatch(/about\.htm/);
  });

  test('footer shows every expected link', async ({ page }) => {
    const about = new AboutPage(page);
    await about.open();
    await expect(about.footerHomeLink).toBeVisible();
    await expect(about.footerAboutUsLink).toBeVisible();
    await expect(about.footerServicesLink).toBeVisible();
    await expect(about.footerContactLink).toBeVisible();
    await expect(about.footerSiteMapLink).toBeVisible();
  });

  test('copyright footer text is visible', async ({ page }) => {
    const about = new AboutPage(page);
    await about.open();
    await expect(page.locator('.copyright')).toContainText(/Parasoft/i);
  });
});
