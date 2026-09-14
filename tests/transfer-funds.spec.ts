import { test, expect } from '../fixtures/testFixtures';
import { TransferFundsPage } from '../pages/TransferFundsPage';
import { AccountOverviewPage } from '../pages/AccountOverviewPage';

test.describe('Transfer Funds page', () => {
  test('the page loads with the form fully populated', async ({ seededOverviewPage, page }) => {
    await seededOverviewPage.menuTransferFunds.click();
    const transfer = new TransferFundsPage(page);
    await transfer.assertLoaded();
    await transfer.waitForAccountsDropToPopulate();

    const fromOptions = await transfer.fromAccountDropdown.locator('option').count();
    expect(fromOptions).toBeGreaterThan(0);
  });

  test('transferring a small amount between two accounts returns a transfer-complete confirmation', async ({
    seededOverviewPage,
    page,
  }) => {
    await seededOverviewPage.menuTransferFunds.click();
    const transfer = new TransferFundsPage(page);
    await transfer.assertLoaded();
    await transfer.waitForAccountsDropToPopulate();

    const fromId = (await transfer.fromAccountDropdown.locator('option').first().getAttribute('value')) ?? '';
    const toId =
      (await transfer.toAccountDropdown.locator('option').nth(1).getAttribute('value')) ?? fromId;
    await transfer.transferFunds({ amount: '10', fromId, toId });

    await transfer.assertSuccessHeading();
  });

  test('navigating back to overview shows the accounts list', async ({ seededOverviewPage, page }) => {
    await seededOverviewPage.menuTransferFunds.click();
    await expect(page).toHaveURL(/transfer\.htm/);
    const transfer = new TransferFundsPage(page);
    await transfer.assertLoaded();

    await page.goto('https://parabank.parasoft.com/parabank/overview.htm');
    const overview = new AccountOverviewPage(page);
    await overview.assertLoaded();
  });
});
