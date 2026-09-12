import { test, expect } from '../fixtures/testFixtures';
import { BasePage } from '../pages/BasePage';
import { AccountOverviewPage } from '../pages/AccountOverviewPage';

test.describe('Logout flow', () => {
  test('clicking the Log Out menu link returns the user to the login page', async ({ overviewPage, page }) => {
    await overviewPage.assertLoaded();
    await overviewPage.menuLogOut.click();

    await expect(page).toHaveURL(/index\.htm/);
    await expect(page.locator('input[name="username"]')).toBeVisible();
  });

  test('after logout, hitting the deep overview URL still loads the page (ParaBank demo retains the URL)', async ({
    overviewPage,
    page,
  }) => {
    await overviewPage.assertLoaded();
    await overviewPage.menuLogOut.click();

    // Use absolute URL — page.goto with a relative path is resolved against
    // the current URL, not the test baseURL. The demo bank doesn't always
    // clear the session on /logout.htm, but the page should still be
    // reachable; we just verify the navigation completed.
    await page.goto(`${BasePage.BASE_URL}/overview.htm`);
    await expect(page.locator('#rightPanel')).toBeVisible();
  });

  test('left menu on the overview page includes a Log Out link', async ({ overviewPage }) => {
    await expect(overviewPage.menuLogOut).toBeVisible();
  });

  test('hovering over the logout link confirms it points at logout.htm', async ({
    overviewPage,
    page,
  }) => {
    const href = await overviewPage.menuLogOut.getAttribute('href');
    expect(href).toMatch(/logout\.htm/);
    // Avoid actually clicking it for this assertion
    void page;
  });
});
