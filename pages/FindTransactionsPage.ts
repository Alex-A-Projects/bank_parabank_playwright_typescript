import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * FindTransactionsPage - /parabank/findtrans.htm
 *
 * The actual form is a series of submit-buttons, each one a self-contained
 * search:
 *   - Find by ID          (input + #findById button)
 *   - Find by exact Date  (input + #findByDate button)
 *   - Find by Date Range  (from/to inputs + #findByDateRange button)
 *   - Find by Amount      (input + #findByAmount button)
 * There is also a `transactionType` select used by some endpoints, but the
 * demo form only exposes the above four.
 */
export class FindTransactionsPage extends BasePage {
  readonly heading: Locator;
  readonly accountDropdown: Locator;

  readonly transactionIdInput: Locator;
  readonly findByIdButton: Locator;

  readonly transactionDateInput: Locator;
  readonly findByDateButton: Locator;

  readonly fromDateInput: Locator;
  readonly toDateInput: Locator;
  readonly findByDateRangeButton: Locator;

  readonly amountInput: Locator;
  readonly findByAmountButton: Locator;

  readonly resultsTable: Locator;
  readonly errorContainer: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('#rightPanel h1.title').first();
    this.accountDropdown = page.locator('select#accountId');

    this.transactionIdInput = page.locator('input#transactionId');
    this.findByIdButton = page.locator('button#findById');

    this.transactionDateInput = page.locator('input#transactionDate');
    this.findByDateButton = page.locator('button#findByDate');

    this.fromDateInput = page.locator('input#fromDate');
    this.toDateInput = page.locator('input#toDate');
    this.findByDateRangeButton = page.locator('button#findByDateRange');

    this.amountInput = page.locator('input#amount');
    this.findByAmountButton = page.locator('button#findByAmount');

    this.resultsTable = page.locator('table#transactionTable');
    this.errorContainer = page.locator('#errorContainer');
  }

  async open(): Promise<void> {
    await this.goto('/findtrans.htm');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/findtrans\.htm/);
    await expect(this.heading).toContainText(/Find Transactions/i);
    await expect(this.accountDropdown).toBeVisible();
    await expect(this.findByIdButton).toBeVisible();
    await expect(this.findByDateButton).toBeVisible();
    await expect(this.findByDateRangeButton).toBeVisible();
    await expect(this.findByAmountButton).toBeVisible();
  }

  /** Select an account from the dropdown. */
  async selectAccount(accountId: string): Promise<void> {
    await this.accountDropdown.selectOption(accountId);
  }

  /** Submit the "Find by Amount" form (no max range — just exact amount). */
  async searchByAmount(opts: { fromId: string; amount: string }): Promise<void> {
    await this.selectAccount(opts.fromId);
    await this.amountInput.fill(opts.amount);
    await this.findByAmountButton.click();
  }

  /** Submit the "Find by Date Range" form. */
  async searchByDateRange(opts: { fromId: string; from: string; to: string }): Promise<void> {
    await this.selectAccount(opts.fromId);
    await this.fromDateInput.fill(opts.from);
    await this.toDateInput.fill(opts.to);
    await this.findByDateRangeButton.click();
  }

  /** Submit the "Find by exact Date" form. */
  async searchByExactDate(opts: { fromId: string; date: string }): Promise<void> {
    await this.selectAccount(opts.fromId);
    await this.transactionDateInput.fill(opts.date);
    await this.findByDateButton.click();
  }

  /** Either the results table renders rows, or an error / empty state is shown. */
  async assertResultsOrEmpty(): Promise<void> {
    await expect(this.resultsTable.locator('tbody').first()).toBeAttached();
  }

  /** Number of rows currently rendered in the results table body. */
  async getResultRowCount(): Promise<number> {
    return await this.page
        .locator('table#transactionTable tbody#transactionBody tr')
        .count();
  }

  /**
   * Wait until the AJAX-search response has rendered rows, or until
   * the timeout elapses. ParaBank loads the results via an XHR so a
   * `click()` returning doesn't mean results are present yet.
   */
  async waitForResults(): Promise<void> {
    await expect(
        this.page.locator('table#transactionTable tbody#transactionBody tr'),
    ).toHaveCount(0, { timeout: 500 }).catch(() => undefined);
    // Either rows appear OR an explicit empty <p> shows.
    await this.page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined);
  }

  /**
   * Extract transaction IDs (from the per-row detail links) and the
   * description text shown in the UI. Used to cross-check against the
   * rows returned by the HSQLDB queries.
   */
  async getResultRows(): Promise<Array<{ id: string; description: string }>> {
    return await this.page.$$eval(
        'table#transactionTable tbody#transactionBody tr',
        (rows) =>
            rows.map((tr) => {
                const link = tr.querySelector('a[href*="transaction.htm?id="]');
                const href = link?.getAttribute('href') ?? '';
                const id = href.includes('?')
                    ? new URLSearchParams(href.split('?')[1]).get('id') ?? ''
                    : '';
                const cells = tr.querySelectorAll('td');
                return {
                    id,
                    description: (cells[1]?.textContent ?? '').trim(),
                };
            }),
    );
  }
}
