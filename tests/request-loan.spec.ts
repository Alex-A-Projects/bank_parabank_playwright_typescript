import { test, expect } from '../fixtures/testFixtures';
import { RequestLoanPage } from '../pages/RequestLoanPage';

test.describe('Request Loan page', () => {
  test('the form renders with funding source dropdown populated', async ({ seededOverviewPage, page }) => {
    await seededOverviewPage.menuRequestLoan.click();
    const request = new RequestLoanPage(page);
    await request.assertLoaded();

    const fromOptions = await request.fromAccountDropdown.locator('option').count();
    expect(fromOptions).toBeGreaterThan(0);
  });

  test('submitting a $100 loan request is processed', async ({ seededOverviewPage, page }) => {
    await seededOverviewPage.menuRequestLoan.click();
    const request = new RequestLoanPage(page);

    const fromId = (await request.fromAccountDropdown.locator('option').first().getAttribute('value')) ?? '';

    await request.requestLoan({ amount: '100', downPayment: '10', fromId: fromId! });
    await request.assertApproved();
  });
});
