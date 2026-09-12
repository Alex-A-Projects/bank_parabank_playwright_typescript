import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * HomePage - the ParaBank landing page at /parabank/index.htm.
 *
 * Holds the customer login panel, "Forgot login info?" link, and the
 * Register link. The ATM / Online Services sidebars are also defined here
 * because they sit on the home page and overlap with several other pages.
 */
export class HomePage extends BasePage {
  // Login form
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly forgotLoginLink: Locator;
  readonly registerLink: Locator;

  // Sidebar links (the ParaBank sidebar links point at WSDL/WADL service
  // endpoints rather than .htm pages, so we match by visible text.)
  readonly withdrawFundsLink: Locator;
  readonly transferFundsSidebarLink: Locator;
  readonly checkBalancesLink: Locator;
  readonly makeDepositsLink: Locator;
  readonly billPayLink: Locator;
  readonly accountHistoryLink: Locator;

  // News links
  readonly newsLink: Locator;

  constructor(page: Page) {
    super(page);

    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('input[value="Log In"]');
    this.forgotLoginLink = page.locator('#loginPanel a:has-text("Forgot login info?")');
    this.registerLink = page.locator('#loginPanel a:has-text("Register")');

    this.withdrawFundsLink = page.locator('#rightPanel a:has-text("Withdraw Funds")').first();
    this.transferFundsSidebarLink = page.locator('#rightPanel a:has-text("Transfer Funds")').first();
    this.checkBalancesLink = page.locator('#rightPanel a:has-text("Check Balances")').first();
    this.makeDepositsLink = page.locator('#rightPanel a:has-text("Make Deposits")').first();
    this.billPayLink = page.locator('#rightPanel a:has-text("Bill Pay")').first();
    this.accountHistoryLink = page.locator('#rightPanel a:has-text("Account History")').first();

    this.newsLink = page.locator('#rightPanel .more a').first();
  }

  /** Open the public home page. */
  async open(): Promise<void> {
    await this.goto('/index.htm');
  }

  /** Submit the customer login form. */
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /** Verify all the elements that should be visible on the home page. */
  async assertLoaded(): Promise<void> {
    await expect(this.page).toHaveTitle(/ParaBank/);
    await expect(this.logoLink).toBeVisible();
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
    await expect(this.forgotLoginLink).toBeVisible();
    await expect(this.registerLink).toBeVisible();
  }

  /** Confirm the login panel headers read as expected. */
  async assertLoginLabels(): Promise<void> {
    const loginPanel = this.page.locator('#loginPanel');
    await expect(loginPanel).toContainText('Username');
    await expect(loginPanel).toContainText('Password');
    // The "Customer Login" heading sits ABOVE the #loginPanel in the DOM.
    await expect(this.page.locator('#loginPanel').locator('xpath=..').locator('h2')).toHaveText(
      'Customer Login',
    );
  }
}
