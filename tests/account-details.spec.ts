import { test, expect } from '../fixtures/testFixtures';

test.describe('Account details (drill-in) page', () => {
  test('clicking an account number on Overview opens its transaction activity', async ({ overviewPage, page }) => {
    await overviewPage.assertLoaded();
    await overviewPage.clickAccountByIndex(0);

    await expect(page).toHaveURL(/activity\.htm/);
    await expect(page.locator('#rightPanel')).toBeVisible();
  });
});
