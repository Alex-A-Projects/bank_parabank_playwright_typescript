import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * RequestLoanPage - /parabank/requestloan.htm
 *
 * Lets the user apply for a loan by funding source, down payment and
 * account id. On approval a new loan account is granted.
 */
export class RequestLoanPage extends BasePage {
  readonly heading: Locator;
  readonly loanAmountInput: Locator;
  readonly downPaymentInput: Locator;
  readonly fromAccountDropdown: Locator;
  readonly applyNowButton: Locator;
  readonly resultHeading: Locator;
  readonly loanStatus: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('#rightPanel h1.title').first();
    this.loanAmountInput = page.locator('input#amount, input[name="amount"]');
    this.downPaymentInput = page.locator('input#downPayment, input[name="downPayment"]');
    this.fromAccountDropdown = page.locator('select#fromAccountId, select[name="fromAccountId"]');
    this.applyNowButton = page.locator('input[value="Apply Now"], button:has-text("Apply Now")');
    this.resultHeading = page.locator('#requestLoanResult h1.title');
    this.loanStatus = page.locator('#loanStatus, #rightPanel p');
  }

  async open(): Promise<void> {
    await this.goto('/requestloan.htm');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/requestloan\.htm/);
    await expect(this.heading).toContainText(/Apply for a Loan/i);
    await expect(this.loanAmountInput).toBeVisible();
    await expect(this.downPaymentInput).toBeVisible();
    await expect(this.fromAccountDropdown).toBeVisible();
    await expect(this.applyNowButton).toBeVisible();
  }

  async requestLoan(opts: { amount: string; downPayment: string; fromId: string }): Promise<void> {
    await this.loanAmountInput.fill(opts.amount);
    await this.downPaymentInput.fill(opts.downPayment);
    await this.fromAccountDropdown.selectOption(opts.fromId);
    await this.applyNowButton.click();
  }

  /**
   * Wait for the funding-source dropdown to be populated. The dropdown is
   * server-rendered and may render empty briefly; the population only
   * counts DOM children because `<option>` elements are not "visible"
   * in the strict Playwright sense while the `<select>` is closed.
   */
  async waitForAccountsDropToPopulate(): Promise<void> {
    for (let i = 0; i < 10; i++) {
      const count = await this.fromAccountDropdown.locator('option').count();
      if (count > 0) return;
      await this.page.waitForTimeout(500);
    }
    throw new Error('Request Loan account dropdown never populated.');
  }

  async assertApproved(): Promise<void> {
    await expect(
      this.page
        .locator('#rightPanel h1.title')
        .filter({ hasText: /Loan Request Processed/i })
        .first(),
    ).toBeVisible();
  }
}
