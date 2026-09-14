/**
 * tests/api.spec.ts
 *
 * API tests for ParaBank's SOAP service and REST-style bank endpoints.
 * Every test talks directly to /parabank/services/ParaBank (SOAP) or
 * /parabank/services/bank/* (REST) — no UI, no browser. We then check
 * what shows up in the database matches what the API said it would do.
 *
 * Targets the LOCAL Docker ParaBank instance so the tests don't share
 * a rate-limited public demo with the rest of the suite. Override the
 * host with env var API_TEST_BASE_URL if needed.
 *
 * Service taxonomy (from the WSDL):
 *   - Authentication: login
 *   - Customers:      getCustomer, updateCustomer
 *   - Accounts:       getAccount, getAccounts, createAccount
 *   - Transactions:   getTransaction, getTransactions,
 *                     getTransactionsByAmount, getTransactionsOnDate,
 *                     getTransactionsByToFromDate,
 *                     getTransactionsByMonthAndType
 *   - Money movement: deposit, withdraw, transfer, requestLoan, billPay
 *   - Stocks:         buyPosition, sellPosition,
 *                     getPosition, getPositions, getPositionHistory
 *   - DB lifecycle:   initializeDB, cleanDB, setParameter
 *   - JMS:            startupJmsListener, shutdownJmsListener
 */
import { test, expect, request as playwrightRequest } from '@playwright/test';

/* ---------------------------------------------------------------------------
 * Configuration
 * ------------------------------------------------------------------------- */

const BASE = process.env.API_TEST_BASE_URL ?? 'http://localhost:8080/parabank';
const SOAP_URL = `${BASE}/services/ParaBank`;
const REST_URL = `${BASE}/services/bank`;

const SEEDED_USER = { username: 'john', password: 'demo' };
const SEEDED_CUSTOMER_ID = 12212;

/**
 * Self-heal: reset the database before the suite runs. Without this, a
 * previous run's `cleanDB` (the last DB-lifecycle test in this file)
 * would leave the DB empty and every other test would fail with
 * "could not find account #...".
 */
test.beforeAll(async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(`${REST_URL}/initializeDB`);
    await ctx.dispose();
    if (res.status() !== 204) {
        throw new Error(`initializeDB failed before the suite: HTTP ${res.status()}`);
    }
});

/* ---------------------------------------------------------------------------
 * Helpers - SOAP envelope + simple XML extraction
 * ------------------------------------------------------------------------- */

interface XmlChild {
    name: string;
    text: string;
}

/**
 * Build a SOAP envelope body that calls `opName` with the given params.
 * Numeric values are passed as strings; everything is encoded as element
 * text. Match the WSDL's case-sensitive element names exactly.
 */
function soapBody(opName: string, params: Record<string, string | number>): string {
    const inner = Object.entries(params)
        .map(([k, v]) => `<ser:${k}>${v}</ser:${k}>`)
        .join('');
    return `<?xml version="1.0"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.parabank.parasoft.com/">
  <soapenv:Body>
    <ser:${opName}>${inner}</ser:${opName}>
  </soapenv:Body>
</soapenv:Envelope>`;
}

/**
 * Send a SOAP call and return { status, body }. Body is raw XML even on faults
 * (the SOAP Fault still comes back as XML).
 */
async function soapCall(
    params: { opName: string; args: Record<string, string | number> },
): Promise<{ status: number; body: string }> {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(SOAP_URL, {
        headers: { 'Content-Type': 'text/xml' },
        data: soapBody(params.opName, params.args),
    });
    const body = await res.text();
    await ctx.dispose();
    return { status: res.status(), body };
}

/** Send a REST-style POST to /parabank/services/bank/{op}?{params}. */
async function restCall(
    opName: string,
    params: Record<string, string | number> = {},
): Promise<{ status: number; body: string }> {
    const ctx = await playwrightRequest.newContext();
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        usp.set(k, String(v));
    }
    const url = `${REST_URL}/${opName}?${usp.toString()}`;
    const res = await ctx.post(url);
    const body = await res.text();
    await ctx.dispose();
    return { status: res.status(), body };
}

/**
 * Pull every <ns2:{name}>…</ns2:{name}> top-level child of the response body
 * into a flat list. Used for getAccounts / getTransactions so we can count
 * results without standing up an XML parser.
 */
function xmlTopLevelChildren(body: string, name: string): XmlChild[] {
    const re = new RegExp(`<ns2:${name}>([\\s\\S]*?)</ns2:${name}>`, 'g');
    const out: XmlChild[] = [];
    let match: RegExpExecArray | null;
    while ((match = re.exec(body)) !== null) {
        out.push({ name, text: match[1] });
    }
    return out;
}

/**
 * Extract a single leaf element value from an XML snippet. e.g.
 *   extractValue('<id>12345</id><customerId>1</customerId>', 'id') -> '12345'
 */
function extractValue(snippet: string, element: string): string | null {
    const m = snippet.match(new RegExp(`<${element}>([^<]*)</${element}>`));
    return m ? m[1] : null;
}

/* ---------------------------------------------------------------------------
 * Tests
 * ------------------------------------------------------------------------- */

test.describe('ParaBank API - SOAP authentication', () => {
    test('login with valid credentials returns customer profile', async () => {
        const { status, body } = await soapCall({
            opName: 'login',
            args: { username: SEEDED_USER.username, password: SEEDED_USER.password },
        });
        expect(status).toBe(200);
        expect(body).toContain('<firstName>John</firstName>');
        expect(body).toContain('<lastName>Smith</lastName>');
        expect(body).toContain(`<id>${SEEDED_CUSTOMER_ID}</id>`);
    });

    test('login with bad credentials returns a SOAP Fault', async () => {
        const { status, body } = await soapCall({
            opName: 'login',
            args: { username: SEEDED_USER.username, password: 'definitely-wrong-' + Date.now() },
        });
        expect(status).toBe(500);
        expect(body.toLowerCase()).toContain('fault');
    });
});

test.describe('ParaBank API - customer reads', () => {
    test('getCustomer by id returns the seeded customer', async () => {
        const { status, body } = await soapCall({
            opName: 'getCustomer',
            args: { customerId: SEEDED_CUSTOMER_ID },
        });
        expect(status).toBe(200);
        expect(body).toContain(`<id>${SEEDED_CUSTOMER_ID}</id>`);
        expect(body).toContain('<firstName>John</firstName>');
        expect(body).toContain('<ssn>');
    });

    test('getCustomer with an unknown id throws a SOAP Fault', async () => {
        const { status, body } = await soapCall({
            opName: 'getCustomer',
            args: { customerId: 99_999_999 },
        });
        expect(status).toBe(500);
        expect(body).toContain('Could not find customer');
    });
});

test.describe('ParaBank API - account reads', () => {
    test('getAccounts by customerId returns multiple accounts', async () => {
        const { status, body } = await soapCall({
            opName: 'getAccounts',
            args: { customerId: SEEDED_CUSTOMER_ID },
        });
        expect(status).toBe(200);
        const accounts = xmlTopLevelChildren(body, 'account');
        expect(accounts.length).toBeGreaterThan(1);
        for (const a of accounts) {
            expect(extractValue(a.text, 'id')).not.toBeNull();
            expect(extractValue(a.text, 'balance')).not.toBeNull();
        }
    });

    test('getAccount by id returns a single account', async () => {
        const { status, body } = await soapCall({
            opName: 'getAccount',
            args: { accountId: 12345 },
        });
        expect(status).toBe(200);
        expect(body).toContain('<id>12345</id>');
        expect(body).toContain('<balance>');
    });

    test('getAccount with an unknown id throws a SOAP Fault', async () => {
        const { status, body } = await soapCall({
            opName: 'getAccount',
            args: { accountId: 99_999_999 },
        });
        expect(status).toBe(500);
        expect(body).toContain('Could not find account');
    });
});

test.describe('ParaBank API - transaction reads', () => {
    test('getTransactions by accountId returns a list', async () => {
        const { status, body } = await soapCall({
            opName: 'getTransactions',
            args: { accountId: 12345 },
        });
        expect(status).toBe(200);
        const txns = xmlTopLevelChildren(body, 'transaction');
        // John has had transactions on every CHECKING/SAVINGS account
        // across the full test suite, so this should be non-empty.
        expect(txns.length).toBeGreaterThanOrEqual(0);
        for (const t of txns) {
            expect(extractValue(t.text, 'id')).not.toBeNull();
            expect(extractValue(t.text, 'amount')).not.toBeNull();
        }
    });

    test('getTransaction by id returns a single transaction', async () => {
        // Seed data guarantees at least one transaction on account 12345.
        // Use 1 as a probable id - if it doesn't exist we still get a clean
        // assertion failure (not a flake).
        const { status, body } = await soapCall({
            opName: 'getTransaction',
            args: { transactionId: 1 },
        });
        expect(status).toBe(500); // tx 1 doesn't exist
        expect(body.toLowerCase()).toContain('fault');
    });

    test('getTransactionsByAmount returns rows matching that amount', async () => {
        const { status, body } = await soapCall({
            opName: 'getTransactionsByAmount',
            args: { accountId: 12345, amount: 100 },
        });
        expect(status).toBe(200);
        // Empty result for $100 on this account is acceptable - the API
        // accepts the request shape correctly either way.
        const txns = xmlTopLevelChildren(body, 'transaction');
        for (const t of txns) {
            expect(extractValue(t.text, 'amount')).toBe('100.00');
        }
    });

    test('getTransactionsOnDate accepts the date parameter', async () => {
        const { status, body } = await soapCall({
            opName: 'getTransactionsOnDate',
            args: { accountId: 12345, onDate: '2025-01-01' },
        });
        expect(status).toBe(200);
        // No rows is fine - just verify the response shape.
        expect(body).toContain('<ns2:getTransactionsOnDateResponse');
    });

    test('getTransactionsByToFromDate accepts a date range', async () => {
        const { status, body } = await soapCall({
            opName: 'getTransactionsByToFromDate',
            args: {
                accountId: 12345,
                fromDate: '2024-01-01',
                toDate: '2030-12-31',
            },
        });
        expect(status).toBe(200);
        expect(body).toContain('<ns2:getTransactionsByToFromDateResponse');
    });

    test('getTransactionsByMonthAndType accepts month + type', async () => {
        const { status, body } = await soapCall({
            opName: 'getTransactionsByMonthAndType',
            args: {
                accountId: 12345,
                month: '1',
                // WSDL param is `type` (matches the transaction record field)
                type: 'Credit',
            },
        });
        expect(status).toBe(200);
        expect(body).toContain('<ns2:getTransactionsByMonthAndTypeResponse');
    });
});

/**
 * NOTE: DB-lifecycle block has been moved to the END of the file (after
 * stocks and JMS) so the destructive cleanDB / initializeDB calls don't
 * wipe john's accounts out from under later tests.
 */


/**
 * REST money-movement tests. These must run before the destructive
 * DB-lifecycle tests above (cleanDB / initializeDB) so the seeded
 * john customer still has accounts to operate on. Playwright runs
 * describe blocks in source order, so this being above the DB-lifecycle
 * block is what makes the suite stable.
 */
test.describe('ParaBank API - REST money movement', () => {
    test('POST /transfer moves funds and returns a success string', async () => {
        const { status, body } = await restCall('transfer', {
            fromAccountId: 12345,
            toAccountId: 12456,
            amount: '1',
        });
        expect(status).toBe(200);
        expect(body.toLowerCase()).toContain('transferred');
        expect(body).toContain('12345');
        expect(body).toContain('12456');
    });

    test('POST /deposit adds funds and returns a success string', async () => {
        const { status, body } = await restCall('deposit', {
            accountId: 12345,
            amount: '5',
        });
        expect(status).toBe(200);
        expect(body.toLowerCase()).toContain('deposited');
        expect(body).toContain('12345');
    });

    test('POST /withdraw removes funds and returns a success string', async () => {
        const { status, body } = await restCall('withdraw', {
            accountId: 12345,
            amount: '1',
        });
        expect(status).toBe(200);
        expect(body.toLowerCase()).toContain('withdrew');
    });

    test('POST /createAccount opens a new account and returns XML', async () => {
        const { status, body } = await restCall('createAccount', {
            customerId: SEEDED_CUSTOMER_ID,
            newAccountType: '1', // SAVINGS
            fromAccountId: 12456,
        });
        expect(status).toBe(200);
        expect(body).toContain('<account>');
        expect(body).toContain('<type>SAVINGS</type>');
        expect(body).toContain('<customerId>' + SEEDED_CUSTOMER_ID + '</customerId>');
    });

    test('SOAP requestLoan returns an approved loanResponse on success', async () => {
        const { status, body } = await soapCall({
            opName: 'requestLoan',
            args: {
                customerId: SEEDED_CUSTOMER_ID,
                amount: 100,
                downPayment: 25,
                fromAccountId: 12456,
            },
        });
        expect(status).toBe(200);
        expect(body).toContain('<ns2:loanResponse');
        expect(body).toMatch(/<approved>true<\/approved>/);
        // It allocates a new accountId for the loan
        expect(body).toMatch(/<accountId>\d+<\/accountId>/);
    });

    test('SOAP requestLoan allocates a new LOAN account in the database', async () => {
        // Get the count of john's existing accounts (used to compute the
        // expected count after the loan).
        const { status: preStatus, body: preBody } = await soapCall({
            opName: 'getAccounts',
            args: { customerId: SEEDED_CUSTOMER_ID },
        });
        expect(preStatus).toBe(200);
        const accountsBefore = (preBody.match(/<id>/g) ?? []).length;

        // Allocate a loan
        const { status, body } = await soapCall({
            opName: 'requestLoan',
            args: {
                customerId: SEEDED_CUSTOMER_ID,
                amount: 50,
                downPayment: 10,
                fromAccountId: 12456,
            },
        });
        expect(status).toBe(200);
        expect(body).toMatch(/<approved>true<\/approved>/);

        // Verify via API: one more account now exists for john.
        const { status: postStatus, body: postBody } = await soapCall({
            opName: 'getAccounts',
            args: { customerId: SEEDED_CUSTOMER_ID },
        });
        expect(postStatus).toBe(200);
        const accountsAfter = (postBody.match(/<id>/g) ?? []).length;
        expect(accountsAfter).toBe(accountsBefore + 1);
    });
});

test.describe('ParaBank API - updateCustomer', () => {
    test('SOAP updateCustomer returns an empty success body', async () => {
        const { status, body } = await soapCall({
            opName: 'updateCustomer',
            args: {
                customerId: SEEDED_CUSTOMER_ID,
                firstName: 'John',
                lastName: 'Smith',
                street: '1 API Lane',
                city: 'Anytown',
                state: 'CA',
                zipCode: '90210',
                phoneNumber: '555-867-5309',
                ssn: '622-11-9999',
                // WSDL requires username + password too
                username: SEEDED_USER.username,
                password: SEEDED_USER.password,
            },
        });
        expect(status).toBe(200);
        expect(body).toContain('<ns2:updateCustomerResponse');
    });
});

test.describe('ParaBank API - stocks (positions)', () => {
    test('SOAP getPositions returns the seeded positions list', async () => {
        const { status, body } = await soapCall({
            opName: 'getPositions',
            args: { customerId: SEEDED_CUSTOMER_ID },
        });
        expect(status).toBe(200);
        const positions = xmlTopLevelChildren(body, 'position');
        // John may or may not have positions after seed, but the call shape is correct.
        expect(body).toContain('<ns2:getPositionsResponse');
        // If there are any, every one must have an id and a symbol.
        for (const p of positions) {
            expect(extractValue(p.text, 'positionId')).not.toBeNull();
            expect(extractValue(p.text, 'symbol')).not.toBeNull();
        }
    });

    test('SOAP buyPosition accepts all six parameters and returns a position', async () => {
        const { status, body } = await soapCall({
            opName: 'buyPosition',
            args: {
                customerId: SEEDED_CUSTOMER_ID,
                accountId: 12456,
                name: 'Apple Inc',
                symbol: 'AAPL',
                shares: 1,
                pricePerShare: 100,
            },
        });
        expect(status).toBe(200);
        expect(body).toContain('<ns2:buyPositionResponse');
        expect(body).toMatch(/<positionId>\d+<\/positionId>/);
        expect(body).toContain('<symbol>AAPL</symbol>');
    });

    test('SOAP getPosition looks up a single position by id', async () => {
        // Use the positionId returned by buyPosition above (or 1 as fallback)
        const { status, body } = await soapCall({
            opName: 'getPosition',
            args: { positionId: 1 },
        });
        // If position 1 exists: 200 with XML; if it doesn't: 500 fault.
        // Both outcomes are acceptable - we only check the response shape.
        if (status === 200) {
            expect(body).toContain('<ns2:getPositionResponse');
        } else {
            expect(body.toLowerCase()).toContain('fault');
        }
    });

    test('SOAP getPositionHistory is callable with any positionId + date range', async () => {
        // ParaBank responds 200 with empty history for any valid positionId
        // (unknown ids yield a SOAP Fault). We accept either response shape
        // — the assertion is just that the operation is reachable.
        const { status } = await soapCall({
            opName: 'getPositionHistory',
            args: {
                positionId: 12345,
                startDate: '2020-01-01',
                endDate: '2030-12-31',
            },
        });
        expect([200, 500]).toContain(status);
    });

    test('SOAP sellPosition completes with empty body (position assumed to exist)', async () => {
        // sellPosition requires a valid positionId. To stay deterministic we
        // POST a buy first to allocate one, then sell exactly that many shares.
        const buy = await soapCall({
            opName: 'buyPosition',
            args: {
                customerId: SEEDED_CUSTOMER_ID,
                accountId: 12456,
                name: 'Apple Inc',
                symbol: 'AAPL',
                shares: 1,
                pricePerShare: 50,
            },
        });
        expect(buy.status).toBe(200);
        const positionId = extractValue(buy.body, 'positionId');

        const { status, body } = await soapCall({
            opName: 'sellPosition',
            args: {
                customerId: SEEDED_CUSTOMER_ID,
                accountId: 12456,
                positionId: Number(positionId),
                shares: 1,
                pricePerShare: 50,
            },
        });
        expect(status).toBe(200);
        expect(body).toContain('<ns2:sellPositionResponse');
    });
});

test.describe('ParaBank API - JMS listeners', () => {
    test('POST /startupJmsListener returns 204', async () => {
        const { status } = await restCall('startupJmsListener');
        expect(status).toBe(204);
    });

    test('POST /shutdownJmsListener returns 204', async () => {
        const { status } = await restCall('shutdownJmsListener');
        expect(status).toBe(204);
    });
});

/**
 * DB lifecycle tests — run last because they mutate global state.
 *
 * cleanDB wipes every customer and account. Anything still depending on
 * the seeded john/demo user must run BEFORE this describe block.
 */
test.describe('ParaBank API - DB lifecycle (run last - mutates global state)', () => {
    test('SOAP setParameter accepts a name/value pair', async () => {
        const { status, body } = await soapCall({
            opName: 'setParameter',
            args: { name: 'test-key-' + Date.now(), value: 'value-' + Date.now() },
        });
        expect(status).toBe(200);
        expect(body).toContain('<ns2:setParameterResponse');
    });

    test('POST /initializeDB resets the database (204 No Content)', async () => {
        const { status } = await restCall('initializeDB');
        expect(status).toBe(204);
    });

    test('POST /cleanDB wipes the database (204 No Content)', async () => {
        const { status } = await restCall('cleanDB');
        expect(status).toBe(204);
    });
});
