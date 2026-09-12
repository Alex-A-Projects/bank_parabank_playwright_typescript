import { test, expect } from '../fixtures/testFixtures';
import { HomePage } from '../pages/HomePage';
import { ValidCustomer } from '../utils/testData';

test.describe('Login flow', () => {
  test('empty credentials stay on the login page and show an error', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await home.loginButton.click();

    await expect(page).toHaveURL(/login\.htm/);
    await expect(home.errorPanel).toBeVisible();
  });

  // ---------------- Form basics ----------------

  test('the username input is named "username"', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await expect(home.usernameInput).toHaveAttribute('name', 'username');
  });

  test('the password input is named "password"', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await expect(home.passwordInput).toHaveAttribute('name', 'password');
  });

  test('the password input is type="password" (masked)', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await expect(home.passwordInput).toHaveAttribute('type', 'password');
  });

  test('the submit button has value="Log In"', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await expect(home.loginButton).toHaveValue('Log In');
  });

  test('both inputs are editable', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await expect(home.usernameInput).toBeEditable();
    await expect(home.passwordInput).toBeEditable();
  });

  // ---------------- Submission behaviors ----------------

  test('entering only username keeps you on login with an error', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await home.usernameInput.fill('someuser');
    await home.loginButton.click();

    await expect(page).toHaveURL(/login\.htm/);
    await expect(home.errorPanel).toBeVisible();
  });

  test('entering only password keeps you on login with an error', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await home.passwordInput.fill('somepass');
    await home.loginButton.click();

    await expect(page).toHaveURL(/login\.htm/);
    await expect(home.errorPanel).toBeVisible();
  });

  test('after a successful login attempt the URL is no longer the home page', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await home.login(ValidCustomer.username, ValidCustomer.password);
    await expect(page).not.toHaveURL(/index\.htm$/);
    
  });
});
