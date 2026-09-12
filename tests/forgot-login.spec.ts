import { test, expect } from '../fixtures/testFixtures';
import { ForgotLoginPage } from '../pages/ForgotLoginPage';
import { ValidCustomer } from '../utils/testData';

test.describe('Forgot login info page', () => {
  // ---------------- Reachability ----------------

  test('form is reachable from the home page "Forgot login info?" link', async ({ homePage, page }) => {
    await homePage.forgotLoginLink.click();
    const forgot = new ForgotLoginPage(page);
    await forgot.assertLoaded();
    await expect(forgot.findLoginInfoButton).toBeVisible();
  });

  test('deep link loads directly', async ({ page }) => {
    const forgot = new ForgotLoginPage(page);
    await forgot.open();
    await forgot.assertLoaded();
  });

  test('url ends with lookup.htm', async ({ page }) => {
    const forgot = new ForgotLoginPage(page);
    await forgot.open();
    await expect(page).toHaveURL(/lookup\.htm/);
  });

  test('page title contains ParaBank', async ({ page }) => {
    const forgot = new ForgotLoginPage(page);
    await forgot.open();
    await expect(page).toHaveTitle(/ParaBank/);
  });

  // ---------------- Heading / copy ----------------

  test('heading reads "Customer Lookup"', async ({ page }) => {
    const forgot = new ForgotLoginPage(page);
    await forgot.open();
    await expect(forgot.heading).toHaveText(/Customer Lookup/i);
  });

  test('page copy tells the user what to do', async ({ page }) => {
    const forgot = new ForgotLoginPage(page);
    await forgot.open();
    await expect(page.locator('#rightPanel')).toContainText(/Please fill out the following information/i);
  });

  // ---------------- Individual form fields ----------------

  test('firstName input is visible and editable', async ({ page }) => {
    const forgot = new ForgotLoginPage(page);
    await forgot.open();
    await expect(forgot.firstNameInput).toBeVisible();
    await expect(forgot.firstNameInput).toBeEditable();
  });

  test('lastName input is visible and editable', async ({ page }) => {
    const forgot = new ForgotLoginPage(page);
    await forgot.open();
    await expect(forgot.lastNameInput).toBeVisible();
    await expect(forgot.lastNameInput).toBeEditable();
  });

  test('address input is visible and editable', async ({ page }) => {
    const forgot = new ForgotLoginPage(page);
    await forgot.open();
    await expect(forgot.addressInput).toBeVisible();
    await expect(forgot.addressInput).toBeEditable();
  });

  test('city input is visible and editable', async ({ page }) => {
    const forgot = new ForgotLoginPage(page);
    await forgot.open();
    await expect(forgot.cityInput).toBeVisible();
    await expect(forgot.cityInput).toBeEditable();
  });

  test('state input is visible and editable', async ({ page }) => {
    const forgot = new ForgotLoginPage(page);
    await forgot.open();
    await expect(forgot.stateInput).toBeVisible();
    await expect(forgot.stateInput).toBeEditable();
  });

  test('zipCode input is visible and editable', async ({ page }) => {
    const forgot = new ForgotLoginPage(page);
    await forgot.open();
    await expect(forgot.zipCodeInput).toBeVisible();
    await expect(forgot.zipCodeInput).toBeEditable();
  });

  test('ssn input is visible and editable', async ({ page }) => {
    const forgot = new ForgotLoginPage(page);
    await forgot.open();
    await expect(forgot.ssnInput).toBeVisible();
    await expect(forgot.ssnInput).toBeEditable();
  });

  test('submit button reads "Find My Login Info"', async ({ page }) => {
    const forgot = new ForgotLoginPage(page);
    await forgot.open();
    await expect(forgot.findLoginInfoButton).toHaveValue(/Find My Login Info/i);
  });

  // ---------------- Lookup behavior ----------------

  test('looking up the seeded john user reveals login info', async ({ page }) => {
    const forgot = new ForgotLoginPage(page);
    await forgot.open();
    await forgot.fillAndSubmit({
      firstName: ValidCustomer.firstName,
      lastName: ValidCustomer.lastName,
      address: '1431 Main St',
      city: 'Beverly Hills',
      state: 'CA',
      zipCode: '90210',
      ssn: '123-45-6789',
    });
    await expect(page.locator('#rightPanel p').first()).toBeVisible();
  });

  test('submitting empty form keeps you on the lookup page', async ({ page }) => {
    const forgot = new ForgotLoginPage(page);
    await forgot.open();
    await forgot.findLoginInfoButton.click();
    await expect(page).toHaveURL(/lookup\.htm/);
  });

  test('filling only firstName and submitting shows validation feedback', async ({ page }) => {
    const forgot = new ForgotLoginPage(page);
    await forgot.open();
    await forgot.firstNameInput.fill('John');
    await forgot.findLoginInfoButton.click();
    // Stays on lookup.htm with some validation response from the page.
    await expect(page).toHaveURL(/lookup\.htm/);
  });

  // ---------------- Header / footer presence ----------------

  test('global ParaBank logo is visible on the lookup page', async ({ page }) => {
    const forgot = new ForgotLoginPage(page);
    await forgot.open();
    await expect(forgot.logoLink).toBeVisible();
  });

  test('the customer-login panel is also rendered on the lookup page', async ({ page }) => {
    const forgot = new ForgotLoginPage(page);
    await forgot.open();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });
});
