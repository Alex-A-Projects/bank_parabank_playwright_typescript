import { test, expect } from '../fixtures/testFixtures';
import { OpenAccountPage } from '../pages/OpenAccountPage';

test.describe('Open New Account page', () => {
  test('the page loads with form controls and dropdowns', async ({ seededOverviewPage, page }) => {
    await seededOverviewPage.menuOpenAccount.click();
    const page_ = new OpenAccountPage(page);
    await page_.assertLoaded();
    await page_.waitForAccountsDropToPopulate();

    // The type dropdown always contains CHECKING and SAVINGS.
    const optionTexts = await page_.typeDropdown.locator('option').allTextContents();
    expect(optionTexts).toEqual(expect.arrayContaining(['CHECKING', 'SAVINGS']));

    // The existing-account dropdown populates with the customer's accounts.
    const fromOptions = await page_.existingAccountDropdown.locator('option').count();
    expect(fromOptions).toBeGreaterThan(0);
  });

  test('opens a new SAVINGS account successfully', async ({ seededOverviewPage, page }) => {
    await seededOverviewPage.menuOpenAccount.click();
    const page_ = new OpenAccountPage(page);
    await page_.assertLoaded();
    await page_.waitForAccountsDropToPopulate();

    const fromId = await page_.existingAccountDropdown
      .locator('option')
      .first()
      .getAttribute('value');

    await page_.openAccount('SAVINGS', fromId ?? undefined);
    await page_.assertSuccessHeading();
  });
});
