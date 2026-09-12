import { test, expect } from '../fixtures/testFixtures';
import { RegisterPage } from '../pages/RegisterPage';
import { generateNewUser } from '../utils/testData';

test.describe('Registration page', () => {
  // ---------------- Reachability ----------------

  test('navigating to the registration page from the home link works', async ({ homePage, page }) => {
    await homePage.registerLink.click();
    await expect(page).toHaveURL(/register\.htm/);
    await expect(page.locator('#rightPanel h1.title').first()).toContainText(/Signing up is easy/i);
  });

  test('deep link loads directly', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await register.assertLoaded();
  });

  test('page title contains ParaBank', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await expect(page).toHaveTitle(/ParaBank/);
  });

  test('heading reads "Signing up is easy!"', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await expect(register.heading).toHaveText(/Signing up is easy!/i);
  });

  // ---------------- Form fields ----------------

  test('all eleven form fields render on the registration page', async ({ homePage, page }) => {
    await homePage.registerLink.click();
    const register = new RegisterPage(page);
    await register.assertLoaded();

    await expect(register.firstNameInput).toBeEditable();
    await expect(register.lastNameInput).toBeEditable();
    await expect(register.addressInput).toBeEditable();
    await expect(register.cityInput).toBeEditable();
    await expect(register.stateInput).toBeEditable();
    await expect(register.zipCodeInput).toBeEditable();
    await expect(register.phoneInput).toBeEditable();
    await expect(register.ssnInput).toBeEditable();
    await expect(register.usernameInput).toBeEditable();
    await expect(register.passwordInput).toBeEditable();
    await expect(register.confirmInput).toBeEditable();
  });

  test('firstName input is named "customer.firstName"', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await expect(register.firstNameInput).toHaveAttribute('name', 'customer.firstName');
  });

  test('lastName input is named "customer.lastName"', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await expect(register.lastNameInput).toHaveAttribute('name', 'customer.lastName');
  });

  test('address input is named "customer.address.street"', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await expect(register.addressInput).toHaveAttribute('name', 'customer.address.street');
  });

  test('city input is named "customer.address.city"', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await expect(register.cityInput).toHaveAttribute('name', 'customer.address.city');
  });

  test('state input is named "customer.address.state"', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await expect(register.stateInput).toHaveAttribute('name', 'customer.address.state');
  });

  test('zipCode input is named "customer.address.zipCode"', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await expect(register.zipCodeInput).toHaveAttribute('name', 'customer.address.zipCode');
  });

  test('phone input is named "customer.phoneNumber"', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await expect(register.phoneInput).toHaveAttribute('name', 'customer.phoneNumber');
  });

  test('ssn input is named "customer.ssn"', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await expect(register.ssnInput).toHaveAttribute('name', 'customer.ssn');
  });

  test('username input is named "customer.username"', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await expect(register.usernameInput).toHaveAttribute('name', 'customer.username');
  });

  test('password input is named "customer.password"', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await expect(register.passwordInput).toHaveAttribute('name', 'customer.password');
  });

  test('confirm input is named "repeatedPassword"', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await expect(register.confirmInput).toHaveAttribute('name', 'repeatedPassword');
  });

  test('password and confirm inputs are type="password" (masked)', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await expect(register.passwordInput).toHaveAttribute('type', 'password');
    await expect(register.confirmInput).toHaveAttribute('type', 'password');
  });

  test('submit button reads "Register"', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await expect(register.registerButton).toHaveValue('Register');
  });

  // ---------------- Submission behaviors ----------------

  test('submitting with a fresh username registers the user and logs them in', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();

    const user = generateNewUser('qa');
    await register.register(user);

    const welcome = page.locator('#rightPanel h1, p').filter({ hasText: /Welcome/i }).first();
    await expect(welcome).toBeVisible();
    await expect(page).toHaveURL(/(overview|register)\.htm/);
  });

  test('password/confirm mismatch keeps the user on the registration page', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();

    const user = generateNewUser('mismatch');
    await register.register({ ...user, confirm: 'TotallyDifferent!' });

    await expect(page).toHaveURL(/register\.htm/);
    await expect(register.errorPanel).toBeVisible();
  });

  test('submitting an empty form keeps the user on the registration page', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await register.registerButton.click();
    await expect(page).toHaveURL(/register\.htm/);
  });

  test('reaching the form via the home Register link is reversible via the ParaBank logo', async ({
    page,
  }) => {
    await page.goto('https://parabank.parasoft.com/parabank/register.htm');
    await page.locator('img[alt="ParaBank"]').click();
    await expect(page).toHaveURL(/index\.htm/);
  });

  // ---------------- Post-registration tab walk ----------------
  // After a successful registration ParaBank auto-logs the user in. We
  // then walk every tab in the left-menu and confirm each page renders.

  test('after registering, the Accounts Overview tab is reachable', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await register.register(generateNewUser('tabs1'));

    await page.locator('#leftPanel a[href*="overview.htm"]').click();
    await expect(page).toHaveURL(/overview\.htm/);
    await expect(page.locator('#rightPanel h1.title').first()).toContainText(/Accounts Overview/i);
  });

  test('after registering, the Open New Account tab is reachable', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await register.register(generateNewUser('tabs2'));

    await page.locator('#leftPanel a[href*="openaccount.htm"]').click();
    await expect(page).toHaveURL(/openaccount\.htm/);
    await expect(page.locator('#rightPanel h1.title').first()).toContainText(/Open New Account/i);
  });

  test('after registering, the Transfer Funds tab is reachable', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await register.register(generateNewUser('tabs3'));

    await page.locator('#leftPanel a[href*="transfer.htm"]').click();
    await expect(page).toHaveURL(/transfer\.htm/);
    await expect(page.locator('#rightPanel h1.title').first()).toContainText(/Transfer Funds/i);
  });

  test('after registering, the Bill Pay tab is reachable', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await register.register(generateNewUser('tabs4'));

    await page.locator('#leftPanel a[href*="billpay.htm"]').click();
    await expect(page).toHaveURL(/billpay\.htm/);
    await expect(page.locator('#rightPanel h1.title').first()).toContainText(/Bill Pay/i);
  });

  test('after registering, the Find Transactions tab is reachable', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await register.register(generateNewUser('tabs5'));

    await page.locator('#leftPanel a[href*="findtrans.htm"]').click();
    await expect(page).toHaveURL(/findtrans\.htm/);
    await expect(page.locator('#rightPanel h1.title').first()).toContainText(/Find Transactions/i);
  });

  test('after registering, the Update Contact Info tab is reachable', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await register.register(generateNewUser('tabs6'));

    await page.locator('#leftPanel a[href*="updateprofile.htm"]').click();
    await expect(page).toHaveURL(/updateprofile\.htm/);
    await expect(page.locator('#rightPanel h1.title').first()).toContainText(/Update Profile/i);
  });

  test('after registering, the Request Loan tab is reachable', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await register.register(generateNewUser('tabs7'));

    await page.locator('#leftPanel a[href*="requestloan.htm"]').click();
    await expect(page).toHaveURL(/requestloan\.htm/);
    await expect(page.locator('#rightPanel h1.title').first()).toContainText(/Apply for a Loan/i);
  });
});
