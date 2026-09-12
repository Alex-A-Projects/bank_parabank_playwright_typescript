import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * TransferFundsPage - /parabank/transfer.htm
 * Allows moving funds between two of the customer's own accounts.
 */
export class TransferFundsPage extends BasePage {
  readonly heading: Locator;
  readonly amountInput: Locator;
  readonly fromAccountDropdown: Locator;
  readonly toAccountDropdown: Locator;
  readonly transferButton: Locator;
  readonly resultHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('#rightPanel h1.title').first();
    this.amountInput = page.locator('input#amount, input[name="amount"]');
    this.fromAccountDropdown = page.locator('select#fromAccountId, select[name="fromAccountId"]');
    this.toAccountDropdown = page.locator('select#toAccountId, select[name="toAccountId"]');
    this.transferButton = page.locator('input[value="Transfer"], button:has-text("Transfer")');
    this.resultHeading = page.locator('#transferResult h1.title');
  }

  async open(): Promise<void> {
    await this.goto('/transfer.htm');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/transfer\.htm/);
    await expect(this.heading).toContainText(/Transfer Funds/i);
    await expect(this.amountInput).toBeVisible();
    await expect(this.fromAccountDropdown).toBeVisible();
    await expect(this.toAccountDropdown).toBeVisible();
    await expect(this.transferButton).toBeVisible();
  }

  async transferFunds(opts: { amount: string; fromId: string; toId: string }): Promise<void> {
    await this.amountInput.fill(opts.amount);
    await this.fromAccountDropdown.selectOption(opts.fromId);
    await this.toAccountDropdown.selectOption(opts.toId);
    await this.transferButton.click();
  }

  async assertSuccessHeading(): Promise<void> {
    // ParaBank re-renders the same page with a success heading. The
    // exact selector drifts between versions, so match anywhere on the
    // right panel as long as it contains the success phrase.
    await expect(
      this.page
        .locator('#rightPanel h1.title')
        .filter({ hasText: /Transfer Complete/i })
        .first(),
    ).toBeVisible();
  }
}
