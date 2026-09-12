import { test } from '../fixtures/testFixtures';
import { BillPayPage } from '../pages/BillPayPage';

test.describe('Bill Pay page', () => {
  test('the page loads with all payee form fields visible', async ({ seededOverviewPage, page }) => {
    await seededOverviewPage.menuBillPay.click();
    const bill = new BillPayPage(page);
    await bill.assertLoaded();

    const fromId = (await bill.fromAccountDropdown.locator('option').first().getAttribute('value')) ?? '';

    await bill.pay({
      payeeName: 'Acme Electric',
      address: '1 Power Lane',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
      phone: '5559876543',
      accountNumber: '12345',
      verifyAccount: '12345',
      amount: '5',
      fromAccountId: fromId!,
    });

    await bill.assertSuccessHeading();
  });
});
