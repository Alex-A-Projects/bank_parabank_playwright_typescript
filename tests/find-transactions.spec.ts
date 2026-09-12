import { test, expect } from '../fixtures/testFixtures';
import { FindTransactionsPage } from '../pages/FindTransactionsPage';

test.describe('Find Transactions page', () => {
  test('the search form is rendered with all four search buttons', async ({ seededOverviewPage, page }) => {
    await seededOverviewPage.menuFindTransactions.click();
    const find = new FindTransactionsPage(page);
    await find.assertLoaded();
    expect(await find.accountDropdown.locator('option').count()).toBeGreaterThan(0);
  });

  test('submitting a tiny amount search renders an empty results table', async ({ seededOverviewPage, page }) => {
    await seededOverviewPage.menuFindTransactions.click();
    const find = new FindTransactionsPage(page);

    const fromId = (await find.accountDropdown.locator('option').first().getAttribute('value')) ?? '';

    await find.searchByAmount({ fromId: fromId!, amount: '0.01' });
    await find.assertResultsOrEmpty();
  });

  test('submitting a date range search renders the results table', async ({ seededOverviewPage, page }) => {
    await seededOverviewPage.menuFindTransactions.click();
    const find = new FindTransactionsPage(page);

    const fromId = (await find.accountDropdown.locator('option').first().getAttribute('value')) ?? '';

    await find.searchByDateRange({ fromId: fromId!, from: '01-01-2020', to: '12-31-2030' });
    await find.assertResultsOrEmpty();
  });
});
