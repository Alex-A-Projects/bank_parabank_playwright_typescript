# ParaBank Playwright + TypeScript Test Suite

End-to-end automation for the public [ParaBank](https://parabank.parasoft.com/parabank/index.htm)
demo banking application, built with **Playwright + TypeScript** and structured
around the **Page Object Model**.

143 tests across 17 spec files — every page / tab on the app is exercised.

## Coverage

| Page / Tab                              | Page Object                          | Spec |
| --------------------------------------- | ------------------------------------ | ---- |
| Home (`index.htm`)                      | `HomePage`                           | `home.spec.ts` |
| About Us (`about.htm`)                  | `AboutPage`                          | `about.spec.ts` |
| Contact (`contact.htm`)                 | `ContactPage`                        | `contact.spec.ts` |
| Customer Lookup (`lookup.htm`)          | `ForgotLoginPage`                    | `forgot-login.spec.ts` |
| Register (`register.htm`)               | `RegisterPage`                       | `register.spec.ts` |
| Login (form on every page)              | `LoginPanel`                         | `login.spec.ts` |
| Admin (`admin.htm`)                     | `AdminPage`                          | `admin.spec.ts` |
| Header / footer cross-navigation sweep  | `BasePage`                           | `footer-navigation.spec.ts` |
| Accounts Overview (`overview.htm`)      | `AccountOverviewPage`                | `account-overview.spec.ts`, `account-details.spec.ts` |
| Activity (`activity.htm`)               | `AccountOverviewPage` (drill-in)     | `account-details.spec.ts` |
| Open New Account (`openaccount.htm`)    | `OpenAccountPage`                    | `open-account.spec.ts` |
| Transfer Funds (`transfer.htm`)         | `TransferFundsPage`                  | `transfer-funds.spec.ts` |
| Bill Pay (`billpay.htm`)                | `BillPayPage`                        | `bill-pay.spec.ts` |
| Find Transactions (`findtrans.htm`)     | `FindTransactionsPage`              | `find-transactions.spec.ts` |
| Update Contact Info (`updateprofile.htm`) | `UpdateContactInfoPage`            | `update-contact-info.spec.ts` |
| Request Loan (`requestloan.htm`)        | `RequestLoanPage`                    | `request-loan.spec.ts` |
| Logout                                  | left-menu link in `AccountOverviewPage` | `logout.spec.ts` |
| Post-registration tab walk              | `RegisterPage` + menu links          | covered inside `register.spec.ts` |

## Project Layout

```
.
├── fixtures/testFixtures.ts        # Custom test fixtures (no skip-on-throttle)
├── pages/
│   ├── BasePage.ts                # Shared locators + goto with rate-limit handling
│   ├── LoginPanel.ts
│   ├── HomePage.ts
│   ├── AboutPage.ts
│   ├── ContactPage.ts
│   ├── ForgotLoginPage.ts
│   ├── RegisterPage.ts
│   ├── AdminPage.ts
│   ├── AccountOverviewPage.ts
│   ├── OpenAccountPage.ts
│   ├── TransferFundsPage.ts
│   ├── BillPayPage.ts
│   ├── FindTransactionsPage.ts
│   ├── UpdateContactInfoPage.ts
│   └── RequestLoanPage.ts
├── tests/
│   ├── about.spec.ts
│   ├── account-details.spec.ts
│   ├── account-overview.spec.ts
│   ├── admin.spec.ts
│   ├── bill-pay.spec.ts
│   ├── contact.spec.ts
│   ├── find-transactions.spec.ts
│   ├── footer-navigation.spec.ts
│   ├── forgot-login.spec.ts
│   ├── home.spec.ts
│   ├── login.spec.ts
│   ├── logout.spec.ts
│   ├── open-account.spec.ts
│   ├── register.spec.ts                # also walks every post-reg tab
│   ├── request-loan.spec.ts
│   ├── transfer-funds.spec.ts
│   └── update-contact-info.spec.ts
├── utils/
│   ├── testData.ts                    # Valid users + generateNewUser()
│   └── helpers.ts
├── global-setup.ts                    # Probes demo bank / waits for 1015 to clear
├── playwright.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Running

```bash
npm install
npx playwright install chromium

# Full suite (1 worker, headless)
npx playwright test

# A single spec
npx playwright test tests/bill-pay.spec.ts

# Pattern: every "Account Overview" test
npx playwright test -g "Account Overview"

# Headed / debug
npx playwright test --headed
npx playwright test --debug

# HTML report
npx playwright show-report
```

## Assertions

Every test follows the same shape — pick a Page Object, run an action, assert the result:

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

## Fixtures

Defined in [fixtures/testFixtures.ts](fixtures/testFixtures.ts):

| Fixture                | What it does |
|------------------------|--------------|
| `homePage`             | `HomePage` POM on a fresh home page |
| `loginPanel`           | The customer-login form fragment |
| `authenticatedPage`    | Page logged in as the seeded `john/demo` |
| `seededAuthedPage`     | logged in **and** demo data reseeded via `/admin.htm` → `INIT` button |
| `overviewPage`         | `AccountOverviewPage` after `authenticatedPage` |
| `seededOverviewPage`   | `AccountOverviewPage` after `seededAuthedPage` |

**Important:** fixtures deliberately do NOT call `test.skip()`. Tests run and
either pass or fail; there is no silent skipping.

## Notable Behaviour & Workarounds

- **Seed accounts:** authenticated tests rely on `seededAuthedPage`. The
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

## Tech

- Playwright 1.48
- TypeScript 5.4 (strict)
- No external assertion libraries — Playwright's `expect` is used everywhere.
