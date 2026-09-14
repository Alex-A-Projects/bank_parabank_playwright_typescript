import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * AccountOverviewPage - the landing page after login (/parabank/overview.htm).
 *
 * Shows the customer's accounts table: each row has an account number link
 * plus a balance. A global "Accounts Overview" header sits above the table.
 */
export class AccountOverviewPage extends BasePage {
  readonly heading: Locator;
  readonly accountsTable: Locator;
  readonly accountRows: Locator;
  readonly totalBalanceCell: Locator;
  readonly accountNumberLinks: Locator;

  // Left-menu links (available after login)
  readonly menuOpenAccount: Locator;
  readonly menuAccountOverview: Locator;
  readonly menuTransferFunds: Locator;
  readonly menuBillPay: Locator;
  readonly menuFindTransactions: Locator;
  readonly menuUpdateContactInfo: Locator;
  readonly menuRequestLoan: Locator;
  readonly menuLogOut: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('#rightPanel h1.title').first();
    this.accountsTable = page.locator('#accountTable');
    this.accountRows = page.locator('#accountTable tbody tr');
    this.totalBalanceCell = page.locator('#accountTable tfoot td').last();
    this.accountNumberLinks = page.locator('#accountTable a');

    // The left nav is rendered inside #leftPanel after authentication
    this.menuOpenAccount = page.locator('#leftPanel a[href*="openaccount.htm"]');
    this.menuAccountOverview = page.locator('#leftPanel a[href*="overview.htm"]');
    this.menuTransferFunds = page.locator('#leftPanel a[href*="transfer.htm"]');
    this.menuBillPay = page.locator('#leftPanel a[href*="billpay.htm"]');
    this.menuFindTransactions = page.locator('#leftPanel a[href*="findtrans.htm"]');
    this.menuUpdateContactInfo = page.locator('#leftPanel a[href*="updateprofile.htm"]');
    this.menuRequestLoan = page.locator('#leftPanel a[href*="requestloan.htm"]');
    this.menuLogOut = page.locator('#leftPanel a[href*="logout.htm"]');
  }

  async open(): Promise<void> {
    await this.goto('/overview.htm');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/overview\.htm/);
    await expect(this.heading).toContainText(/Accounts Overview/i);
    await expect(this.accountsTable).toBeVisible();
  }

  /** Number of account rows visible (excluding the header). */
  async getAccountRowCount(): Promise<number> {
    return await this.accountRows.count();
  }

  /** Click an account number to drill into its details. */
  async clickAccountByIndex(index: number): Promise<void> {
    await this.accountNumberLinks.nth(index).click();
  }

  /** All the post-login tabs are reachable from the left menu; this proves it. */
  async assertLeftMenuPresent(): Promise<void> {
    await expect(this.menuAccountOverview).toBeVisible();
    await expect(this.menuOpenAccount).toBeVisible();
    await expect(this.menuTransferFunds).toBeVisible();
    await expect(this.menuBillPay).toBeVisible();
    await expect(this.menuFindTransactions).toBeVisible();
    await expect(this.menuUpdateContactInfo).toBeVisible();
    await expect(this.menuRequestLoan).toBeVisible();
    await expect(this.menuLogOut).toBeVisible();
  }

  /**
 * Get the total balance string as displayed in the table.
 * ParaBank renders the "Total" cell inside <tbody> rather than <tfoot>;
 * we find it by searching for any row whose first cell reads "Total".
 */
async getTotalBalance(): Promise<string> {
    const totalCellText = await this.page
        .locator('#accountTable tr')
        .filter({ has: this.page.locator('td', { hasText: /^Total$/ }) })
        .first()
        .locator('td')
        .nth(1)
        .textContent();
    return (totalCellText ?? '').trim();
}

  /**
   * Parse every account row in the table and return
   * `{ accountNumber, balance }` pairs in row order.
   * The `accountTable` columns are: [Account, Balance, Available].
   */
  async getAccountRows(): Promise<Array<{ accountNumber: string; balance: string }>> {
    const rows = await this.accountRows.evaluateAll((trs) =>
      trs.map((tr) => {
        const cells = tr.querySelectorAll('td');
        return {
          accountNumber: (cells[0]?.textContent ?? '').trim(),
          balance: (cells[1]?.textContent ?? '').trim(),
        };
      }),
    );
    return rows;
  }
}
