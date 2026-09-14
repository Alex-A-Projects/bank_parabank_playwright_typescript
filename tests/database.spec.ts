/**
 * tests/database.spec.ts
 *
 * End-to-end tests that combine Playwright (UI) with direct HSQLDB
 * queries via the Java DbQuery helper. These tests validate that the
 * actions a user takes on the ParaBank UI actually persist to the
 * database - the strongest portfolio pattern for a banking QA suite.
 *
 * IMPORTANT: this file targets the LOCAL Docker instance of ParaBank,
 * not the public parasoft.com demo. The public demo and the Docker
 * container use different databases, so a UI action against parasoft.com
 * would not leave any row to verify in localhost:9001. We override the
 * POM base URL with `setBaseUrl(...)` after constructing each POM.
 *
 * The Docker container must be running (`docker ps` should list parabank).
 */
import { test, expect, Page } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { RegisterPage, NewUserPayload } from '../pages/RegisterPage';
import { AccountOverviewPage } from '../pages/AccountOverviewPage';
import { OpenAccountPage } from '../pages/OpenAccountPage';
import { TransferFundsPage } from '../pages/TransferFundsPage';
import { UpdateContactInfoPage, ContactProfile } from '../pages/UpdateContactInfoPage';
import { BillPayPage } from '../pages/BillPayPage';
import { RequestLoanPage } from '../pages/RequestLoanPage';
import { FindTransactionsPage } from '../pages/FindTransactionsPage';
import {
    getCustomerByUsername,
    customerExistsByUsername,
    getCustomerCount,
    getAccountsByCustomer,
    getAccountCountForCustomer,
    getTransactionsByAccount,
    getTransactionCountForAccount,
    getAccountBalance,
    transferExistsForAccount,
    loanPaymentExistsForAccount,
    loanAccountExists,
    getLoanAccountCount,
    Account,
    AccountType,
    BankTransaction,
} from '../utils/db/dbClient';

/** The Docker ParaBank instance - shared by every test in this file. */
const LOCAL_PARABANK = 'http://localhost:8080/parabank';
// Override via env var DB_TEST_BASE_URL if your Docker setup exposes ParaBank on a different host or port.

const BASE_URL = process.env.DB_TEST_BASE_URL ?? LOCAL_PARABANK;

/** Reliable seeded user with multiple accounts and positive balances. */
const SEEDED_USER = { username: 'john', password: 'demo' };

/**
 * Build a POM that navigates against the local Docker ParaBank rather
 * than the public cloud demo. Wrapping in a tiny helper keeps the test
 * body focused on behaviour, not on plumbing.
 */
function localHomePage(page: Page): HomePage {
    const p = new HomePage(page);
    p.setBaseUrl(BASE_URL);
    return p;
}
function localRegisterPage(page: Page): RegisterPage {
    const p = new RegisterPage(page);
    p.setBaseUrl(BASE_URL);
    return p;
}
function localOverviewPage(page: Page): AccountOverviewPage {
    const p = new AccountOverviewPage(page);
    p.setBaseUrl(BASE_URL);
    return p;
}
function localOpenAccountPage(page: Page): OpenAccountPage {
    const p = new OpenAccountPage(page);
    p.setBaseUrl(BASE_URL);
    return p;
}
function localTransferPage(page: Page): TransferFundsPage {
    const p = new TransferFundsPage(page);
    p.setBaseUrl(BASE_URL);
    return p;
}
function localUpdateProfilePage(page: Page): UpdateContactInfoPage {
    const p = new UpdateContactInfoPage(page);
    p.setBaseUrl(BASE_URL);
    return p;
}
function localBillPayPage(page: Page): BillPayPage {
    const p = new BillPayPage(page);
    p.setBaseUrl(BASE_URL);
    return p;
}
function localRequestLoanPage(page: Page): RequestLoanPage {
    const p = new RequestLoanPage(page);
    p.setBaseUrl(BASE_URL);
    return p;
}
function localFindTransactionsPage(page: Page): FindTransactionsPage {
    const p = new FindTransactionsPage(page);
    p.setBaseUrl(BASE_URL);
    return p;
}

/**
 * Generate a unique username under ParaBank's 20-char limit. Past that
 * length the form silently truncates and two distinct test runs collide
 * on the truncated value (which the bank reports as "already exists").
 * Format: `<prefix>_<8 hex>` e.g. `dbtest_a1b2c3d4` (15 chars).
 */
function uniqueUser(prefix: string): NewUserPayload {
    const rand = Math.floor(Math.random() * 0xffffffff)
        .toString(16)
        .padStart(8, '0');
    const username = `${prefix}_${rand}`;
    return {
        firstName: 'DB',
        lastName: 'Tester',
        address: '1 DB Lane',
        city: 'DBville',
        state: 'CA',
        zipCode: '90210',
        phone: '5551234567',
        ssn: '777889900',
        username,
        password: 'dbP@ssw0rd',
        confirm: 'dbP@ssw0rd',
    };
}

/**
 * Register a brand-new user via the UI. After registration ParaBank
 * shows a "Welcome" panel on the same URL and authenticates the user.
 * Returns the user payload AND a ready-to-use AccountOverviewPage for
 * subsequent left-menu navigation.
 */
async function registerFreshUser(
    page: Page,
    prefix: string,
): Promise<{ user: NewUserPayload; overview: AccountOverviewPage }> {
    const user = uniqueUser(prefix);

    const register = localRegisterPage(page);
    await register.open();
    await register.register(user);

    // ParaBank may either stay on register.htm (showing the welcome panel)
    // or redirect to overview.htm. Either way, look for the welcome text
    // to confirm success.
    await expect(
        page
            .locator('#rightPanel h1, #rightPanel p')
            .filter({ hasText: /Welcome/i })
            .first(),
    ).toBeVisible({ timeout: 15_000 });

    // Navigate to overview via the left menu (always available post-login).
    const overview = localOverviewPage(page);
    await page.locator('#leftPanel a[href*="overview.htm"]').click();
    await expect(page).toHaveURL(/overview\.htm/);

    return { user, overview };
}

/** Login as john/demo (the reliably-seeded multi-account user). */
async function loginAsSeededUser(page: Page): Promise<AccountOverviewPage> {
    const home = localHomePage(page);
    await home.open();
    await home.login(SEEDED_USER.username, SEEDED_USER.password);
    await expect(page).toHaveURL(/overview\.htm/);
    return localOverviewPage(page);
}

/**
 * Pre-flight: confirm the Docker HSQLDB is reachable before any test runs.
 * Failures here point to either the DB or the network, not the test logic.
 */
test.beforeAll(async () => {
    const count = await getCustomerCount();
    expect(count).toBeGreaterThanOrEqual(0);
});

test.describe('ParaBank database tests (Docker HSQLDB)', () => {

    test.describe('Pure DB - customer table', () => {

        test('customer exists in ParaBank database', async () => {
            // 'parasoft' (Bob Parasoft) is part of the Docker seed and
            // always present, even after /admin.htm INIT resets state.
            const customer = await getCustomerByUsername('parasoft');
            expect(customer.firstName).toBe('Bob');
            expect(customer.lastName).toBe('Parasoft');
            expect(customer.username).toBe('parasoft');
        });

        test('looking up an unknown username returns no customer', async () => {
            const exists = await customerExistsByUsername(
                'no_such_user_' + Date.now(),
            );
            expect(exists).toBe(false);
        });
    });

    test.describe('UI - registration persists to CUSTOMER table', () => {

        test('registering a new customer inserts a CUSTOMER row with the submitted values', async ({ page }) => {
            const user = uniqueUser('dbtest');

            // Precondition: must not exist yet
            expect(await customerExistsByUsername(user.username)).toBe(false);

            const register = localRegisterPage(page);
            await register.open();
            await register.register(user);

            // Wait for the post-register welcome panel - this is how we
            // know the registration request was accepted.
            await expect(
                page
                    .locator('#rightPanel h1, #rightPanel p')
                    .filter({ hasText: /Welcome/i })
                    .first(),
            ).toBeVisible({ timeout: 15_000 });

            // The row must now be there with the values submitted
            const row = await getCustomerByUsername(user.username);
            expect(row.firstName).toBe(user.firstName);
            expect(row.lastName).toBe(user.lastName);
            expect(row.username).toBe(user.username);
            expect(row.city).toBe(user.city);
            expect(row.state).toBe(user.state);
        });

        test('registering a customer increases customer count by exactly 1', async ({ page }) => {
            const user = uniqueUser('dbtestcnt');

            const before = await getCustomerCount();

            const register = localRegisterPage(page);
            await register.open();
            await register.register(user);

            // The left menu (Overview / Open Account / ...) only appears
            // once ParaBank has authenticated the new user. This is the
            // most reliable signal that the registration persisted.
            await expect(
                page.locator('#leftPanel a[href*="overview.htm"]'),
            ).toBeVisible({ timeout: 20_000 });

            const after = await getCustomerCount();
            expect(after - before).toBe(1);
        });
    });

    test.describe('UI - open account persists to ACCOUNT table', () => {

        test('opening a savings account after registration inserts a new ACCOUNT row', async ({ page }) => {
            const { user, overview } = await registerFreshUser(page, 'dbopen');

            const owner = await getCustomerByUsername(user.username);
            const accountsBefore = await getAccountsByCustomer(owner.id);

            await overview.menuOpenAccount.click();
            await expect(page).toHaveURL(/openaccount\.htm/);

            const openAcct = localOpenAccountPage(page);
            await openAcct.waitForAccountsDropToPopulate();
            await openAcct.openAccount('SAVINGS');

            const accountsAfter = await getAccountsByCustomer(owner.id);
            expect(accountsAfter.length).toBe(accountsBefore.length + 1);

            const newest = accountsAfter[accountsAfter.length - 1];
            expect(newest.type).toBe(AccountType.SAVINGS);
            // The new account must be linked back to the same customer
            expect(newest.customerId).toBe(owner.id);
        });

        test('opening a checking account after registration inserts an ACCOUNT row of type CHECKING', async ({ page }) => {
            const { user, overview } = await registerFreshUser(page, 'dbopen2');

            await overview.menuOpenAccount.click();
            await expect(page).toHaveURL(/openaccount\.htm/);

            const openAcct = localOpenAccountPage(page);
            await openAcct.waitForAccountsDropToPopulate();
            await openAcct.openAccount('CHECKING');

            const owner = await getCustomerByUsername(user.username);
            const accounts = await getAccountsByCustomer(owner.id);
            const newest = accounts[accounts.length - 1];
            expect(newest.type).toBe(AccountType.CHECKING);
        });

        test('account count for the new customer is exactly the number opened', async ({ page }) => {
            const { user, overview } = await registerFreshUser(page, 'dbopen3');

            const owner = await getCustomerByUsername(user.username);
            const accountsAfterRegistration = await getAccountCountForCustomer(owner.id);
            expect(accountsAfterRegistration).toBeGreaterThanOrEqual(1);

            await overview.menuOpenAccount.click();
            await expect(page).toHaveURL(/openaccount\.htm/);

            const openAcct = localOpenAccountPage(page);
            await openAcct.waitForAccountsDropToPopulate();
            await openAcct.openAccount('SAVINGS');

            const accountsAfterOpening = await getAccountCountForCustomer(owner.id);
            expect(accountsAfterOpening).toBe(accountsAfterRegistration + 1);
        });
    });

    test.describe('UI - transfer creates TRANSACTION rows', () => {

        test('a $50 transfer moves money in the DB and inserts both transaction rows', async ({ page }) => {
            const overview = await loginAsSeededUser(page);

            const owner = await getCustomerByUsername(SEEDED_USER.username);
            const accounts: Account[] = await getAccountsByCustomer(owner.id);
            expect(accounts.length).toBeGreaterThanOrEqual(2);

            const fromAccount = accounts[0];
            const toAccount = accounts[1];

            const fromBalanceBefore = await getAccountBalance(fromAccount.id);
            const toBalanceBefore = await getAccountBalance(toAccount.id);
            const txCountBeforeFrom = await getTransactionCountForAccount(fromAccount.id);
            const txCountBeforeTo = await getTransactionCountForAccount(toAccount.id);

            await overview.menuTransferFunds.click();
            await expect(page).toHaveURL(/transfer\.htm/);

            const transfer = localTransferPage(page);
            await transfer.waitForAccountsDropToPopulate();
            await transfer.transferFunds({
                amount: '50',
                fromId: String(fromAccount.id),
                toId: String(toAccount.id),
            });
            await transfer.assertSuccessHeading();

            // 1. Source account: balance decreased by $50
            const fromBalanceAfter = await getAccountBalance(fromAccount.id);
            expect(fromBalanceAfter).toBeCloseTo(fromBalanceBefore - 50, 2);

            // 2. Destination account: balance increased by $50
            const toBalanceAfter = await getAccountBalance(toAccount.id);
            expect(toBalanceAfter).toBeCloseTo(toBalanceBefore + 50, 2);

            // 3. Each side picked up exactly one new transaction row
            expect(await getTransactionCountForAccount(fromAccount.id)).toBe(txCountBeforeFrom + 1);
            expect(await getTransactionCountForAccount(toAccount.id)).toBe(txCountBeforeTo + 1);

            // 4. The transaction exists in the DB with the right amount on the source side
            expect(await transferExistsForAccount(fromAccount.id, 50)).toBe(true);
        });

        test('the most recent transaction on the source account has DESCRIPTION "Funds Transfer Sent"', async ({ page }) => {
            const overview = await loginAsSeededUser(page);

            const owner = await getCustomerByUsername(SEEDED_USER.username);
            const accounts = await getAccountsByCustomer(owner.id);
            expect(accounts.length).toBeGreaterThanOrEqual(2);

            const fromAccount = accounts[0];
            const toAccount = accounts[1];

            await overview.menuTransferFunds.click();
            await expect(page).toHaveURL(/transfer\.htm/);

            const transfer = localTransferPage(page);
            await transfer.waitForAccountsDropToPopulate();
            await transfer.transferFunds({
                amount: '25',
                fromId: String(fromAccount.id),
                toId: String(toAccount.id),
            });
            await transfer.assertSuccessHeading();

            const txs = await getTransactionsByAccount(fromAccount.id);
            const last = txs[txs.length - 1];
            expect(last.amount).toBeCloseTo(25, 2);
            expect(last.description).toMatch(/Funds Transfer Sent/);
        });
    });

    test.describe('UI - bill payment persists to TRANSACTION table', () => {

        test('a bill payment inserts a TRANSACTION row describing the bill', async ({ page }) => {
            const overview = await loginAsSeededUser(page);

            const owner = await getCustomerByUsername(SEEDED_USER.username);
            const accounts = await getAccountsByCustomer(owner.id);
            expect(accounts.length).toBeGreaterThanOrEqual(1);
            const fromAccount = accounts[0];

            const txCountBefore = await getTransactionCountForAccount(fromAccount.id);

            await overview.menuBillPay.click();
            await expect(page).toHaveURL(/billpay\.htm/);

            // Use a unique bill amount + payee so we can find this exact row.
            const uniqueAmount = (Math.floor(Math.random() * 900) + 100).toString();
            const uniquePayee = `DB Payee ${Date.now().toString(36)}`;

            const bill = localBillPayPage(page);
            await bill.pay({
                payeeName: uniquePayee,
                address: '1 Bill St',
                city: 'Payville',
                state: 'CA',
                zipCode: '90210',
                phone: '5551112222',
                accountNumber: '99999',
                verifyAccount: '99999',
                amount: uniqueAmount,
                fromAccountId: String(fromAccount.id),
            });
            await bill.assertSuccessHeading();

            // New TRANSACTION row landed on the source account
            const txCountAfter = await getTransactionCountForAccount(fromAccount.id);
            expect(txCountAfter).toBe(txCountBefore + 1);

            // The new row describes this exact bill
            const txs = await getTransactionsByAccount(fromAccount.id);
            const last = txs[txs.length - 1];
            expect(last.amount).toBeCloseTo(Number(uniqueAmount), 2);
            expect(last.description).toContain(uniquePayee);
        });
    });

    test.describe('UI - balance in the overview matches the database', () => {

        test('total balance shown in the Accounts Overview equals the sum of account balances in the DB', async ({ page }) => {
            const overview = await loginAsSeededUser(page);

            // Read the totals from the UI. ParaBank renders the "Total"
            // row inside <tbody> too, so we filter out non-numeric rows
            // (the Total row has "Total" in the account-number cell).
            const allRows = await overview.getAccountRows();
            const rowsInUi = allRows.filter(r => /^\d+$/.test(r.accountNumber.trim()));

            // Read the same accounts from the DB
            const owner = await getCustomerByUsername(SEEDED_USER.username);
            const accountsInDb = await getAccountsByCustomer(owner.id);

            // Both should report the same number of accounts
            expect(rowsInUi.length).toBe(accountsInDb.length);

            // Build a {accountId: balance} map from the DB and compare per row.
            const norm = (s: string) => s.trim().replace(/\s+/g, '');
            const dbBalances: Record<string, number> = {};
            for (const a of accountsInDb) {
                dbBalances[String(a.id)] = a.balance;
            }

            for (const row of rowsInUi) {
                const uiBal = Number(norm(row.balance).replace(/[$,]/g, ''));
                const dbBal = dbBalances[norm(row.accountNumber)];
                expect(dbBal).toBeDefined();
                expect(uiBal).toBeCloseTo(dbBal!, 2);
            }

            // Cross-check with the tfoot total too
            const totalUiText = (await overview.getTotalBalance()).replace(/[$,\s]/g, '');
            const totalDb = accountsInDb.reduce((sum, a) => sum + a.balance, 0);
            expect(Number(totalUiText)).toBeCloseTo(totalDb, 2);
        });
    });

    test.describe('UI - update profile writes to CUSTOMER table', () => {

        test('changing the city and phone via /updateprofile.htm writes new values to the CUSTOMER row', async ({ page }) => {
            // Register a brand-new user so we don't clobber the seeded one
            const { user, overview } = await registerFreshUser(page, 'dbprof');

            // Sanity: the original values are what we registered
            const before = await getCustomerByUsername(user.username);
            expect(before.city).toBe(user.city);
            expect(before.phoneNumber).toBe(user.phone);

            await overview.menuUpdateContactInfo.click();
            await expect(page).toHaveURL(/updateprofile\.htm/);

            const updated: ContactProfile = {
                firstName: user.firstName,
                lastName: user.lastName,
                address: user.address,
                city: 'NewCity',
                state: 'NY',
                zipCode: user.zipCode,
                phone: '5550009999',
            };

            const profile = localUpdateProfilePage(page);
            await profile.updateProfile(updated);
            await profile.assertProfileUpdated();

            // The CUSTOMER row must now reflect the new values
            const after = await getCustomerByUsername(user.username);
            expect(after.city).toBe('NewCity');
            expect(after.state).toBe('NY');
            expect(after.phoneNumber).toBe('5550009999');

            // And it must still be the same row (UPDATE, not INSERT)
            expect(after.id).toBe(before.id);
        });
    });

    test.describe('Negative - no DB writes from invalid actions', () => {

        test('a failed login does not change the customer count', async ({ page }) => {
            const home = localHomePage(page);
            await home.open();

            const before = await getCustomerCount();

            // Try logging in as the seeded user with a wrong password
            // (a username that doesn't exist would also be enough; both
            // should produce zero DB writes)
            await home.login(SEEDED_USER.username, 'totallyWrongPassword_' + Date.now());
            // No assertion on URL — ParaBank may show an error or stay on home.
            // The point is the DB count didn't change.

            const after = await getCustomerCount();
            expect(after).toBe(before);
        });

        test('submitting an empty transfer form inserts zero TRANSACTION rows', async ({ page }) => {
            const overview = await loginAsSeededUser(page);

            const owner = await getCustomerByUsername(SEEDED_USER.username);
            const accounts = await getAccountsByCustomer(owner.id);
            expect(accounts.length).toBeGreaterThanOrEqual(1);
            const candidate = accounts[0];

            // Snapshot DB state before the failed submission.
            const txCountBefore = await getTransactionCountForAccount(candidate.id);
            const balanceBefore = await getAccountBalance(candidate.id);

            await overview.menuTransferFunds.click();
            await expect(page).toHaveURL(/transfer\.htm/);

            const transfer = localTransferPage(page);
            await transfer.waitForAccountsDropToPopulate();

            // Submit the transfer form with NO input at all. ParaBank
            // answers with "An internal error has occurred" — the
            // important thing is the DB must remain untouched. (Note:
            // if you fill the amount but leave the account dropdowns
            // blank, ParaBank silently falls back to the first account
            // and the transfer succeeds, so we deliberately submit the
            // form truly empty here.)
            await transfer.transferButton.click();

            // The "Error!" h1 is the failure-path indicator. ParaBank wraps
            // it in whitespace, so match by substring rather than equality.
            await expect(
                page.locator('#rightPanel h1.title').filter({ hasText: 'Error!' }),
            ).toBeVisible({ timeout: 5_000 });

            // The amount-related TRANSACTION row count is what really
            // matters. Note: ParaBank's right panel retains previous
            // results (it doesn't clear the "Transfer Complete" h1
            // between submissions), so we don't assert "no Transfer
            // Complete heading" — instead we verify the candidate
            // account has no new row tied to this submission.
            expect(await getTransactionCountForAccount(candidate.id)).toBe(txCountBefore);
            expect(await getAccountBalance(candidate.id)).toBe(balanceBefore);
        });
    });

    test.describe('UI - loan request persists to ACCOUNT and TRANSACTION tables', () => {

        test('a $100 / $25 loan inserts a new LOAN ACCOUNT row with the loan amount', async ({ page }) => {
            // Use a fresh user because ParaBank's loan processor starts
            // rejecting further loan requests once a customer has
            // accumulated too many prior loans (the seeded john user
            // hits this cap quickly when other tests add loans).
            const { user, overview } = await registerFreshUser(page, 'dbloan');

            const owner = await getCustomerByUsername(user.username);
            const accountsBefore = await getAccountCountForCustomer(owner.id);
            const loansBefore = await getLoanAccountCount(owner.id);

            await overview.menuRequestLoan.click();
            await expect(page).toHaveURL(/requestloan\.htm/);

            const loan = localRequestLoanPage(page);
            await loan.waitForAccountsDropToPopulate();

            // Use the only account the fresh user has.
            const dbAccounts = await getAccountsByCustomer(owner.id);
            const source = dbAccounts.find((a) => a.type === AccountType.CHECKING);
            expect(source).toBeDefined();

            await loan.requestLoan({
                amount: '100',
                downPayment: '25',
                fromId: String(source!.id),
            });
            await loan.assertApproved();

            // 1. Exactly one new ACCOUNT row total for the customer
            const accountsAfter = await getAccountCountForCustomer(owner.id);
            expect(accountsAfter).toBe(accountsBefore + 1);

            // 2. Exactly one new LOAN (TYPE=2) account exists with $100 balance
            const loansAfter = await getLoanAccountCount(owner.id);
            expect(loansAfter).toBe(loansBefore + 1);
            expect(await loanAccountExists(owner.id, 100)).toBe(true);
        });

        test('the loan down payment creates a TRANSACTION row on the funding account', async ({ page }) => {
            const { user, overview } = await registerFreshUser(page, 'dbloan2');

            const owner = await getCustomerByUsername(user.username);
            const accounts = await getAccountsByCustomer(owner.id);
            const sourceAccount = accounts.find((a) => a.type === AccountType.CHECKING);
            expect(sourceAccount).toBeDefined();

            const txCountBefore = await getTransactionCountForAccount(sourceAccount!.id);

            await overview.menuRequestLoan.click();
            await expect(page).toHaveURL(/requestloan\.htm/);

            const loan = localRequestLoanPage(page);
            await loan.waitForAccountsDropToPopulate();

            await loan.requestLoan({
                amount: '300',
                downPayment: '30',
                fromId: String(sourceAccount!.id),
            });
            await loan.assertApproved();

            // The source account now has a new TRANSACTION row describing the down payment
            expect(await getTransactionCountForAccount(sourceAccount!.id)).toBe(txCountBefore + 1);
            expect(await loanPaymentExistsForAccount(sourceAccount!.id, 30)).toBe(true);
        });
    });

    test.describe('UI - Find Transactions reflects the database (read-side)', () => {

        test('Find by Amount returns exactly the DB rows whose amount matches', async ({ page }) => {
            const overview = await loginAsSeededUser(page);

            // Pick an account that has accumulated a few transactions.
            // Account 12456 (CHECKING) reliably has rows from prior tests.
            const owner = await getCustomerByUsername(SEEDED_USER.username);
            const sourceAccountId = 12456;
            const sourceAccount = (await getAccountsByCustomer(owner.id)).find(
                a => a.id === sourceAccountId,
            );
            expect(sourceAccount).toBeDefined();

            const dbTxs = await getTransactionsByAccount(sourceAccountId);
            expect(dbTxs.length).toBeGreaterThan(0);

            // Pick the most-frequent amount on that account so the
            // expected-row count is high enough to be meaningful.
            const amountCounts = new Map<number, number>();
            for (const t of dbTxs) {
                amountCounts.set(t.amount, (amountCounts.get(t.amount) ?? 0) + 1);
            }
            let bestAmount = 0;
            let bestCount = 0;
            for (const [amt, n] of amountCounts) {
                if (n > bestCount) {
                    bestAmount = amt;
                    bestCount = n;
                }
            }
            expect(bestCount).toBeGreaterThanOrEqual(2);
            const amountStr = bestAmount.toFixed(2);

            await overview.menuFindTransactions.click();
            await expect(page).toHaveURL(/findtrans\.htm/);

            const find = localFindTransactionsPage(page);
            await find.searchByAmount({ fromId: String(sourceAccountId), amount: amountStr });
            await find.waitForResults();

            // The UI row count must match the DB count for that amount.
            expect(await find.getResultRowCount()).toBe(bestCount);
        });

        test('Find by ID returns the exact DB row that matches', async ({ page }) => {
            const overview = await loginAsSeededUser(page);

            const sourceAccountId = 12456;
            const dbTxs = await getTransactionsByAccount(sourceAccountId);
            expect(dbTxs.length).toBeGreaterThan(0);
            const target = dbTxs[0];

            await overview.menuFindTransactions.click();
            await expect(page).toHaveURL(/findtrans\.htm/);

            const find = localFindTransactionsPage(page);
            await find.selectAccount(String(sourceAccountId));
            await find.transactionIdInput.fill(String(target.id));
            await find.findByIdButton.click();
            await find.waitForResults();

            // Find-by-ID returns exactly one row, with the same id
            // and description the DB recorded for this transaction.
            const rows = await find.getResultRows();
            expect(rows.length).toBe(1);
            expect(rows[0].id).toBe(String(target.id));
            expect(rows[0].description).toBe(target.description);
        });

        test('Find by ID with a non-existent id returns no rows', async ({ page }) => {
            const overview = await loginAsSeededUser(page);

            await overview.menuFindTransactions.click();
            await expect(page).toHaveURL(/findtrans\.htm/);

            const find = localFindTransactionsPage(page);
            await find.selectAccount('12456');
            await find.transactionIdInput.fill('99999999');
            await find.findByIdButton.click();
            await find.waitForResults();

            expect(await find.getResultRowCount()).toBe(0);
        });
    });
});
