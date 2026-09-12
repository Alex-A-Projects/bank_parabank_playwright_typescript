import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * OpenAccountPage - /parabank/openaccount.htm
 *
 * Allows the user to open an additional CHECKING or SAVINGS account.
 * The selected type comes from a dropdown, then the form submits to the
 * same URL; on success the new account number is shown with a
 * "congratulations" heading.
 */
export class OpenAccountPage extends BasePage {
  readonly heading: Locator;
  readonly typeDropdown: Locator;
  readonly existingAccountDropdown: Locator;
  readonly openAccountButton: Locator;
  readonly resultPanel: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('#rightPanel h1.title').first();
    this.typeDropdown = page.locator('select#type, select[name="type"]');
    this.existingAccountDropdown = page.locator('select#fromAccountId, select[name="fromAccountId"]');
    this.openAccountButton = page.locator('input[value="Open New Account"], button:has-text("Open New Account")');
    this.resultPanel = page.locator('#openAccountResult, .panel');
  }

  async open(): Promise<void> {
    await this.goto('/openaccount.htm');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/openaccount\.htm/);
    await expect(this.heading).toContainText(/Open New Account/i);
    await expect(this.typeDropdown).toBeVisible();
    await expect(this.existingAccountDropdown).toBeVisible();
    await expect(this.openAccountButton).toBeVisible();
  }

  /** Wait until the existing-account dropdown has at least one option. */
  async waitForAccountsDropToPopulate(): Promise<void> {
    // The dropdown is server-rendered with the user's accounts after login.
    // It can render empty briefly if the demo data is still initialising.
    for (let i = 0; i < 10; i++) {
      const count = await this.existingAccountDropdown.locator('option').count();
      if (count > 0) return;
      await this.page.waitForTimeout(500);
    }
    throw new Error('Existing-account dropdown never populated.');
  }

  /** Open an account of the given type. Funds will be transferred from the source account. */
  async openAccount(type: 'CHECKING' | 'SAVINGS', fromAccountId?: string): Promise<void> {
    await this.typeDropdown.selectOption(type);
    if (fromAccountId) {
      await this.existingAccountDropdown.selectOption(fromAccountId);
    }
    await this.openAccountButton.click();
  }

  async assertSuccessHeading(): Promise<void> {
    await expect(
      this.page
        .locator('#rightPanel h1.title')
        .filter({ hasText: /Account Opened!/i })
        .first(),
    ).toBeVisible();
  }
}
