import { test, expect } from '../fixtures/testFixtures';
import { ContactPage } from '../pages/ContactPage';

test.describe('Contact page', () => {
  test('navigates from footer link and shows contact content', async ({ homePage, page }) => {
    await homePage.footerContactLink.click();
    const contact = new ContactPage(page);
    await contact.assertLoaded();
  });

  test('deep link loads directly', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.open();
    await contact.assertLoaded();
  });

  test('global header is still present on the contact page', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.open();
    await expect(contact.logoLink).toBeVisible();
    await expect(contact.adminPageLink).toBeVisible();
  });

  // ---------------- Page basics ----------------

  test('page title contains ParaBank', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.open();
    await expect(page).toHaveTitle(/ParaBank/);
  });

  test('url ends with contact.htm', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.open();
    await expect(page).toHaveURL(/contact\.htm/);
  });

  test('heading reads "Customer Care"', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.open();
    await expect(contact.heading).toHaveText(/Customer Care/i);
  });

  test('page copy explains how to reach support', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.open();
    await expect(page.locator('#rightPanel')).toContainText(/Email support is available/i);
  });

  // ---------------- Form fields ----------------

  test('name input is visible and editable', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.open();
    const name = page.locator('input#name, input[name="name"]').first();
    await expect(name).toBeVisible();
    await expect(name).toBeEditable();
  });

  test('email input is visible and editable', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.open();
    const email = page.locator('input#email, input[name="email"]').first();
    await expect(email).toBeVisible();
    await expect(email).toBeEditable();
  });

  test('phone input is visible and editable', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.open();
    const phone = page.locator('input#phone, input[name="phone"]').first();
    await expect(phone).toBeVisible();
    await expect(phone).toBeEditable();
  });

  test('message textarea is visible and editable', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.open();
    const message = page.locator('textarea#message, textarea[name="message"]').first();
    await expect(message).toBeVisible();
    await expect(message).toBeEditable();
  });

  test('Submit button reads "Send to Customer Care"', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.open();
    await expect(page.locator('input[value="Send to Customer Care"]')).toBeVisible();
  });

  // ---------------- Form behavior ----------------

  test('filling the form keeps you on the contact page', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.open();
    await page.locator('input[name="name"]').fill('Alex Tester');
    await page.locator('input[name="email"]').fill('[email protected]');
    await page.locator('input[name="phone"]').fill('555-123-4567');
    await page.locator('textarea[name="message"]').fill('Hello, this is a test message.');
    await expect(page).toHaveURL(/contact\.htm/);
  });

  // ---------------- Navigation ----------------

  test('header Solutions menu still links home / about / admin', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.open();
    await expect(page.locator('#headerPanel a[href*="about.htm"]').first()).toHaveCount(1);
    await expect(page.locator('#headerPanel a[href*="services.htm"]').first()).toHaveCount(1);
    await expect(page.locator('#headerPanel a[href*="admin.htm"]').first()).toHaveCount(1);
  });

  test('header breadcrumb shows home / about / contact', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.open();
    const breadcrumb = page.locator('ul.button').first();
    await expect(breadcrumb).toContainText('home');
    await expect(breadcrumb).toContainText('about');
    await expect(breadcrumb).toContainText('contact');
  });

  test('clicking the ParaBank logo from Contact navigates back home', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.open();
    await contact.clickLogo();
    await expect(page).toHaveURL(/index\.htm/);
  });

  test('clicking the breadcrumb "home" link navigates to home', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.open();
    await page.locator('.button a[href*="index.htm"]').first().click();
    await expect(page).toHaveURL(/index\.htm/);
  });

  test('clicking the breadcrumb "about" link navigates to about', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.open();
    await page.locator('.button a[href*="about.htm"]').first().click();
    await expect(page).toHaveURL(/about\.htm/);
  });

  // ---------------- Customer login panel (available everywhere) ----------------

  test('Customer Login panel is also rendered on the contact page', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.open();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[value="Log In"]')).toBeVisible();
  });
});
