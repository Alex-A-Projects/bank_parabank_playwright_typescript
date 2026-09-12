import { test, expect } from '../fixtures/testFixtures';

/**
 * Footer + header cross-page navigation test. This walks every public
 * link in the ParaBank header/footer and asserts each one lands on a
 * sensible page. It's an end-to-end sweep designed to catch both broken
 * links and header-removal regressions.
 */
test.describe('Footer / global navigation sweep', () => {
  test('home -> About via header', async ({ homePage, page }) => {
    await homePage.goto('/index.htm');
    await homePage.aboutUsLink.click();
    await expect(page).toHaveURL(/about\.htm/);
  });

  test('home -> Services via header', async ({ homePage, page }) => {
    await homePage.goto('/index.htm');
    await homePage.servicesLink.click();
    await expect(page).toHaveURL(/services\.htm/);
  });

  test('home -> Admin via header', async ({ homePage, page }) => {
    await homePage.goto('/index.htm');
    await homePage.adminPageLink.click();
    await expect(page).toHaveURL(/admin\.htm/);
  });

  test('home -> Contact via footer', async ({ homePage, page }) => {
    await homePage.goto('/index.htm');
    await homePage.footerContactLink.click();
    await expect(page).toHaveURL(/contact\.htm/);
  });

  test('home -> Home via footer', async ({ homePage, page }) => {
    await homePage.goto('/about.htm');
    await homePage.footerHomeLink.click();
    await expect(page).toHaveURL(/index\.htm/);
  });

  test('home -> Site Map via footer', async ({ homePage, page }) => {
    await homePage.goto('/index.htm');
    await homePage.footerSiteMapLink.click();
    await expect(page).toHaveURL(/sitemap\.htm/);
    await expect(page.locator('#rightPanel')).toBeVisible();
  });
});
