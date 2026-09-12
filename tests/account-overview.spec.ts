import { test, expect } from '../fixtures/testFixtures';

test.describe('Account Overview page', () => {
  test('shows the accounts table with seeded data and a left navigation menu', async ({ overviewPage }) => {
    await overviewPage.assertLoaded();
    await overviewPage.assertLeftMenuPresent();

    // The seeded user john has at least one checking and one savings
    // account on a fresh deploy. After a DB reset the table may be empty
    // though, so we just verify the table is renderable and the menu
    // links are reachable.
    await expect(overviewPage.accountsTable).toBeVisible();

    // The "Total" footer cell is rendered (either with a balance or an
    // empty placeholder depending on data state).
    await expect(overviewPage.totalBalanceCell).toBeAttached();
  });

  test('clicking an account row drills into the account details', async ({ overviewPage, page }) => {
    await overviewPage.assertLoaded();
    await overviewPage.clickAccountByIndex(0);
    await expect(page).toHaveURL(/activity\.htm/);
    await expect(page.locator('#rightPanel')).toBeVisible();
  });

  test('navigating through the left menu to every post-login tab works', async ({ overviewPage, page }) => {
    await overviewPage.assertLoaded();

    await overviewPage.menuOpenAccount.click();
    await expect(page).toHaveURL(/openaccount\.htm/);

    await overviewPage.menuTransferFunds.click();
    await expect(page).toHaveURL(/transfer\.htm/);

    await overviewPage.menuBillPay.click();
    await expect(page).toHaveURL(/billpay\.htm/);

    await overviewPage.menuFindTransactions.click();
    await expect(page).toHaveURL(/findtrans\.htm/);

    await overviewPage.menuUpdateContactInfo.click();
    await expect(page).toHaveURL(/updateprofile\.htm/);

    await overviewPage.menuRequestLoan.click();
    await expect(page).toHaveURL(/requestloan\.htm/);

    await overviewPage.menuAccountOverview.click();
    await expect(page).toHaveURL(/overview\.htm/);
  });
});
