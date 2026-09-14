# ParaBank Playwright + TypeScript Test Suite

End-to-end automation for [ParaBank](https://parabank.parasoft.com/parabank/index.htm)
built with **Playwright + TypeScript** and structured around the **Page Object Model**.

The suite covers three layers:

1. **UI** — Playwright drives the browser against every page / tab.
2. **API** — ParaBank's SOAP service (`/services/ParaBank`) and REST-style
   bank endpoints (`/services/bank/*`) are exercised directly, without a
   browser.
3. **Database** — the ParaBank HSQLDB is queried via JDBC so every UI/API
   action can be verified against the actual row it persisted.

192 tests across 19 spec files.

## Quick start

```bash
# 1. Install
npm install
npx playwright install chromium

# 2. Bring up the local ParaBank container (used by database + API tests)
docker run -d --name parabank -p 8080:8080 -p 9001:9001 parasoft/parabank

# 3. Compile the JDBC helper (regenerated automatically each run, but first
#    time it needs an explicit javac)
javac -cp utils/db/hsqldb-2.7.4.jar utils/db/DbQuery.java

# 4. Run the suite
npx playwright test
```

The cloud-only spec files (everything in `tests/` except `database.spec.ts`
and `api.spec.ts`) talk to `parabank.parasoft.com` and need no Docker setup.

## Coverage

### UI — 192 tests across 17 spec files

The classic UI surface (every page / tab is exercised) is documented in
the table below. All UI tests live in `tests/*.spec.ts` and run against
`https://parabank.parasoft.com/parabank/`.

| Page / Tab                                | Page Object                          | Spec |
| ----------------------------------------- | ------------------------------------ | ---- |
| Home (`index.htm`)                        | `HomePage`                           | `home.spec.ts` |
| About Us (`about.htm`)                    | `AboutPage`                          | `about.spec.ts` |
| Contact (`contact.htm`)                   | `ContactPage`                        | `contact.spec.ts` |
| Customer Lookup (`lookup.htm`)            | `ForgotLoginPage`                    | `forgot-login.spec.ts` |
| Register (`register.htm`)                 | `RegisterPage`                       | `register.spec.ts` |
| Login (form on every page)                | `LoginPanel`                         | `login.spec.ts` |
| Admin (`admin.htm`)                       | `AdminPage`                          | `admin.spec.ts` |
| Header / footer cross-navigation sweep    | `BasePage`                           | `footer-navigation.spec.ts` |
| Accounts Overview (`overview.htm`)        | `AccountOverviewPage`                | `account-overview.spec.ts`, `account-details.spec.ts` |
| Activity (`activity.htm`)                 | `AccountOverviewPage` (drill-in)     | `account-details.spec.ts` |
| Open New Account (`openaccount.htm`)      | `OpenAccountPage`                    | `open-account.spec.ts` |
| Transfer Funds (`transfer.htm`)           | `TransferFundsPage`                  | `transfer-funds.spec.ts` |
| Bill Pay (`billpay.htm`)                  | `BillPayPage`                        | `bill-pay.spec.ts` |
| Find Transactions (`findtrans.htm`)       | `FindTransactionsPage`               | `find-transactions.spec.ts` |
| Update Contact Info (`updateprofile.htm`) | `UpdateContactInfoPage`              | `update-contact-info.spec.ts` |
| Request Loan (`requestloan.htm`)          | `RequestLoanPage`                    | `request-loan.spec.ts` |
| Logout                                    | left-menu link in `AccountOverviewPage` | `logout.spec.ts` |
| Post-registration tab walk                | `RegisterPage` + menu links          | covered inside `register.spec.ts` |

### Database — 19 tests (`tests/database.spec.ts`)

End-to-end tests that combine a UI action with a direct HSQLDB read so the
suite can prove what the bank *actually* persisted.

All tests target `http://localhost:8080/parabank` (the Docker container) and
talk to HSQLDB on `localhost:9001` via JDBC. Override via `DB_TEST_BASE_URL`.

| Group                 | Tests | Pattern |
|-----------------------|------:|---------|
| Pure DB (CUSTOMER)    | 2     | direct query only |
| UI → DB (registration) | 2    | form submit + row appears |
| UI → DB (open account) | 3    | open form + ACCOUNT row |
| UI → DB (transfer)    | 2     | transfer form + 2 TRANSACTION rows |
| UI → DB (bill pay)    | 1     | bill-pay form + new TRANSACTION |
| UI ↔ DB (overview)    | 1     | UI total balance == sum of DB balances |
| UI → DB (update profile) | 1 | profile UI → CUSTOMER row updated |
| UI → DB (loan)        | 2     | loan request → LOAN account + down-payment transaction |
| UI ↔ DB (find transactions) | 3 | DB row ↔ UI results table |
| Negative (no DB write from invalid action) | 2 | failed login + empty form |

### API — 30 tests (`tests/api.spec.ts`)

Direct calls to ParaBank's SOAP service and REST-style bank endpoints. No
browser — just `playwrightRequest` HTTP. All tests target the Docker
container, override via `API_TEST_BASE_URL`.

| Group                | Tests | Operations covered |
|----------------------|------:|---------------------|
| Authentication       | 2     | `login` (valid + invalid creds) |
| Customer reads       | 2     | `getCustomer` (existing + missing id) |
| Account reads        | 3     | `getAccounts`, `getAccount` (existing + missing id) |
| Transaction reads    | 6     | `getTransactions`, `getTransaction`, `getTransactionsByAmount`, `getTransactionsOnDate`, `getTransactionsByToFromDate`, `getTransactionsByMonthAndType` |
| Money movement       | 5     | `transfer`, `deposit`, `withdraw`, `createAccount`, `requestLoan` |
| Customer writes      | 1     | `updateCustomer` |
| Stocks               | 4     | `getPositions`, `buyPosition`, `getPosition`, `getPositionHistory`, `sellPosition` |
| JMS                  | 2     | `startupJmsListener`, `shutdownJmsListener` |
| DB lifecycle         | 3     | `initializeDB`, `cleanDB`, `setParameter` |

## Project Layout

```
.
├── fixtures/testFixtures.ts        # Cloud UI fixtures (no skip-on-throttle)
├── pages/                          # Page Object Model
│   ├── BasePage.ts                 # Shared locators + Cloudflare-aware goto +
│   │                               # setBaseUrl() per-instance override hook
│   ├── HomePage.ts
│   ├── RegisterPage.ts
│   ├── OpenAccountPage.ts
│   ├── TransferFundsPage.ts
│   ├── BillPayPage.ts
│   ├── FindTransactionsPage.ts
│   ├── UpdateContactInfoPage.ts
│   ├── RequestLoanPage.ts
│   ├── AccountOverviewPage.ts
│   ├── ContactPage.ts
│   ├── ForgotLoginPage.ts
│   ├── AdminPage.ts
│   ├── AboutPage.ts
│   └── LoginPanel.ts
├── utils/
│   ├── testData.ts                 # Valid users + generateNewUser()
│   └── db/                         # HSQLDB helper for the database test layer
│       ├── DbQuery.java            # Mode-dispatched CLI: 17 query modes
│       ├── DbQuery.class           # Compiled by javac
│       ├── dbClient.ts             # Typed TypeScript wrapper
│       └── hsqldb-2.7.4.jar        # JDBC driver
├── tests/                          # 19 spec files, see coverage above
├── global-setup.ts                 # Probes the cloud demo bank to clear 1015s
├── playwright.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Running

```bash
# All tests (cloud UI + Docker DB/API)
npx playwright test

# One spec
npx playwright test tests/database.spec.ts
npx playwright test tests/api.spec.ts
npx playwright test tests/transfer-funds.spec.ts

# Subset by describe / name
npx playwright test -g "open account"
npx playwright test -g "loan"

# Headed / debug
npx playwright test --headed
npx playwright test --debug

# HTML report
npx playwright show-report

# Regenerate the JDBC class after editing DbQuery.java
javac -cp utils/db/hsqldb-2.7.4.jar utils/db/DbQuery.java
```

## Fixtures

Defined in [fixtures/testFixtures.ts](fixtures/testFixtures.ts):

| Fixture              | What it does |
|----------------------|--------------|
| `homePage`           | `HomePage` POM on a fresh home page |
| `loginPanel`         | The customer-login form fragment |
| `authenticatedPage`  | Page logged in as the seeded `john/demo` |
| `seededAuthedPage`   | logged in **and** demo data reseeded via `/admin.htm` → `INIT` button |
| `overviewPage`       | `AccountOverviewPage` after `authenticatedPage` |
| `seededOverviewPage` | `AccountOverviewPage` after `seededAuthedPage` |

**Important:** fixtures deliberately do NOT call `test.skip()`. Tests run and
either pass or fail; there is no silent skipping.

## Database test layer

The two new layers (database + API) point at the local Docker ParaBank, not
the public cloud demo. This is enforced via `BasePage.setBaseUrl(url)` (called
from each POM inside the spec) and a hard-coded `BASE_URL` constant per
spec file. Override any of them with an env var:

| Spec           | Override env var     |
|----------------|----------------------|
| `database.spec.ts` | `DB_TEST_BASE_URL` |
| `api.spec.ts`      | `API_TEST_BASE_URL` |

To add a new JDBC query:

1. Add a `case "my-mode":` branch in [utils/db/DbQuery.java](utils/db/DbQuery.java).
2. Run `javac -cp utils/db/hsqldb-2.7.4.jar utils/db/DbQuery.java`.
3. Add a typed wrapper in [utils/db/dbClient.ts](utils/db/dbClient.ts) that
   calls `dbExec("my-mode", args)`.
4. Use it from a test.

## Assertions

Every UI test follows the same shape — pick a Page Object, run an action,
assert the result:

```ts
test('opens a new SAVINGS account successfully', async ({ seededOverviewPage, page }) => {
  await seededOverviewPage.menuOpenAccount.click();

  const open = new OpenAccountPage(page);
  await open.assertLoaded();
  await open.waitForAccountsDropToPopulate();

  const fromId = await open.existingAccountDropdown
    .locator('option').first().getAttribute('value');
  await open.openAccount('SAVINGS', fromId ?? undefined);

  await open.assertSuccessHeading();
});
```

API tests follow a similar shape — call a helper, assert on the response:

```ts
test('login with valid credentials returns customer profile', async () => {
  const { status, body } = await soapCall({
    opName: 'login',
    args: { username: 'john', password: 'demo' },
  });
  expect(status).toBe(200);
  expect(body).toContain('<firstName>John</firstName>');
});
```

Database tests use a mix of both shapes — UI action then DB assertion:

```ts
const owner = await getCustomerByUsername(user.username);
const accountsInDb = await getAccountsByCustomer(owner.id);
expect(accountsInDb.length).toBe(accountsBefore.length + 1);
```

## Notable Behaviour & Workarounds

- **Seed accounts:** authenticated UI tests rely on `seededAuthedPage`. The
  fixture logs in as `john/demo`, then POSTs `/admin.htm` with
  `button[value="INIT"]` to repopulate the demo dataset before running.
- **Cloudflare 1015:** the public ParaBank cluster enforces aggressive rate
  limits. `BasePage.goto()` retries 3× with exponential backoff (12s → 24s → 48s).
  For long suites, `global-setup.ts` additionally probes the host up front so
  the whole run pauses until the bank is healthy.
- **Public demo accepts any credentials** — ParaBank auto-creates a user the
  first time it sees a username/password pair. The empty-form submit is the
  only path that surfaces the "Login Failed!" error.
- **`new URL('/path', base)` quirk:** the JS `URL` constructor treats a
  leading slash as replacing the entire base path. `BasePage.goto()` strips
  the leading slash so `goto('/index.htm')` becomes
  `https://parabank.parasoft.com/parabank/index.htm` instead of
  `https://parabank.parasoft.com/index.htm`.
- **Username length limit:** ParaBank's registration form silently
  truncates usernames past ~20 chars. Two distinct generated usernames
  longer than 20 will silently collide (the bank reports "already exists").
  `uniqueUser()` in [tests/database.spec.ts](tests/database.spec.ts) caps
  the suffix at 8 hex chars (15 chars total) for this reason.
- **Account TYPE values:** ParaBank encodes account kinds as integers in
  the DB column `ACCOUNT.TYPE`: `0` = `CHECKING`, `1` = `SAVINGS`,
  `2` = `LOAN`. Available as [AccountType in dbClient.ts](utils/db/dbClient.ts).
- **Loan-cap on `john`:** the seeded john customer is denied further loans
  once he accumulates a few prior loans. The loan tests in
  `database.spec.ts` register a fresh user via `registerFreshUser()` so each
  run starts with zero prior loans.
- **`TRANSACTION.TYPE`:** ParaBank uses TYPE=1 for both debit and credit
  rows and disambiguates them via `DESCRIPTION` (`Funds Transfer Sent` vs
  `Funds Transfer Received`). A single $100 transfer therefore produces two
  rows, each with `AMOUNT=100`.
- **ParaBank's API has two access patterns for the same operations:**
  SOAP XML at `/services/ParaBank` (envelope body, returns XML) and
  REST-style POST at `/services/bank/{op}?{params}` (query string, returns
  plain text or simple XML). Both are publicly documented and both are
  covered by the API suite.
- **DB-lifecycle API tests are destructive.** `cleanDB` wipes every customer
  and account. In `api.spec.ts` those tests are placed in the LAST `describe`
  block and the file has a `test.beforeAll` that re-seeds the DB via
  `POST /initializeDB`. Don't re-order that block.
- **Empty-form transfer fails without DB writes.** Submitting the transfer
  form with the amount AND both account dropdowns blank falls back silently
  to the first account and succeeds; submitting it truly empty triggers
  "An internal error has occurred and has been logged" with zero
  TRANSACTION rows written.

## Tech

- Playwright 1.63
- TypeScript 5.9 (strict)
- No external assertion libraries — Playwright's `expect` is used everywhere.
- HSQLDB 2.7.4 (bundled) as the JDBC driver; the Docker image exposes the
  same version over `localhost:9001`.
