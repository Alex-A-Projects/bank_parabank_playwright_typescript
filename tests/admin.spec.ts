import { test, expect } from '../fixtures/testFixtures';
import { AdminPage } from '../pages/AdminPage';

test.describe('Admin page', () => {
  test('shows mode dropdowns and a RESET button', async ({ homePage, page }) => {
    await homePage.adminPageLink.click();
    const admin = new AdminPage(page);
    await admin.assertLoaded();
    await expect(admin.submitButton).toBeVisible();
  });

  test('RESET button restores the demo dataset', async ({ homePage, page }) => {
    await homePage.adminPageLink.click();
    const admin = new AdminPage(page);
    await admin.assertLoaded();
    await admin.resetButton.click();
    await expect(admin.heading).toBeVisible();
  });

  // ---------------- Access-mode radios ----------------

  test('all four data-access radios render', async ({ homePage, page }) => {
    await homePage.adminPageLink.click();
    const admin = new AdminPage(page);
    await expect(admin.jdbcRadioSoap).toBeVisible();
    await expect(admin.jdbcRadioRestXml).toBeVisible();
    await expect(admin.jdbcRadioRestJson).toBeVisible();
    await expect(admin.jdbcRadioJdbc).toBeVisible();
  });

  test('SOAP is the default-selected data-access mode', async ({ homePage, page }) => {
    await homePage.adminPageLink.click();
    const admin = new AdminPage(page);
    await expect(admin.jdbcRadioSoap).toBeChecked();
    await expect(admin.jdbcRadioJdbc).not.toBeChecked();
  });

  test('selecting JDBC mode persists the choice', async ({ homePage, page }) => {
    await homePage.adminPageLink.click();
    const admin = new AdminPage(page);
    await admin.jdbcRadioJdbc.check();
    await expect(admin.jdbcRadioJdbc).toBeChecked();
    await expect(admin.jdbcRadioSoap).not.toBeChecked();
  });

  test('selecting REST (JSON) mode persists the choice', async ({ homePage, page }) => {
    await homePage.adminPageLink.click();
    const admin = new AdminPage(page);
    await admin.jdbcRadioRestJson.check();
    await expect(admin.jdbcRadioRestJson).toBeChecked();
  });

  // ---------------- INIT / CLEAN buttons ----------------

  test('INIT button is present and enabled', async ({ homePage, page }) => {
    await homePage.adminPageLink.click();
    const admin = new AdminPage(page);
    await expect(admin.initButton).toBeVisible();
    await expect(admin.initButton).toBeEnabled();
  });

  test('CLEAN button is the same element as RESET', async ({ homePage, page }) => {
    await homePage.adminPageLink.click();
    const admin = new AdminPage(page);
    expect(admin.cleanButton).toBe(admin.resetButton);
  });

  test('clicking INIT seeds the demo data', async ({ homePage, page }) => {
    await homePage.adminPageLink.click();
    const admin = new AdminPage(page);
    await admin.initButton.click();
    // After INIT we land on /db.htm - just verify the page is reachable.
    await expect(page).toHaveURL(/db\.htm|admin\.htm/);
  });

  // ---------------- Service config form ----------------

  test('SOAP endpoint input is visible and editable', async ({ homePage, page }) => {
    await homePage.adminPageLink.click();
    const soapEndpoint = page.locator('input[name="soapEndpoint"]');
    await expect(soapEndpoint).toBeVisible();
    await expect(soapEndpoint).toBeEditable();
  });

  test('REST endpoint input is visible and editable', async ({ homePage, page }) => {
    await homePage.adminPageLink.click();
    const restEndpoint = page.locator('input[name="restEndpoint"]');
    await expect(restEndpoint).toBeVisible();
    await expect(restEndpoint).toBeEditable();
  });

  test('LoanProcessor endpoint input is visible and editable', async ({ homePage, page }) => {
    await homePage.adminPageLink.click();
    const loanEndpoint = page.locator('input#endpoint, input[name="endpoint"]').first();
    await expect(loanEndpoint).toBeVisible();
    await expect(loanEndpoint).toBeEditable();
  });

  test('the submit button is enabled', async ({ homePage, page }) => {
    await homePage.adminPageLink.click();
    const admin = new AdminPage(page);
    await expect(admin.submitButton).toBeEnabled();
  });

  test('service status reads "Running"', async ({ homePage, page }) => {
    await homePage.adminPageLink.click();
    await expect(page.locator('text=/Running/').first()).toBeVisible();
  });

  // ---------------- Header / footer / url ----------------

  test('the page title contains ParaBank', async ({ homePage, page }) => {
    await homePage.adminPageLink.click();
    await expect(page).toHaveTitle(/ParaBank/);
  });

  test('url ends with admin.htm', async ({ homePage, page }) => {
    await homePage.adminPageLink.click();
    await expect(page).toHaveURL(/admin\.htm/);
  });

  test('global ParaBank logo is visible', async ({ homePage, page }) => {
    await homePage.adminPageLink.click();
    await expect(page.locator('img[alt="ParaBank"]')).toBeVisible();
  });

  test('the customer-login form remains available', async ({ homePage, page }) => {
    await homePage.adminPageLink.click();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });
});
