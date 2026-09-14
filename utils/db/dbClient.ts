import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execFileAsync = promisify(execFile);
const DB_DIR = path.resolve('utils/db');
const DB_CLASSPATH = `${DB_DIR}/hsqldb-2.7.4.jar:${DB_DIR}`;

/**
 * Dispatch a single mode + args to the Java DbQuery helper and return stdout.
 * Empty stdout means the helper returned no rows (or "false" for an
 * existsQuery - caller can treat that as the negative answer).
 */
async function dbExec(mode: string, args: string[] = []): Promise<string> {
    const { stdout } = await execFileAsync('java', [
        '-cp',
        DB_CLASSPATH,
        'DbQuery',
        mode,
        ...args,
    ]);
    return stdout;
}

// ---------------- Types ----------------

export interface Customer {
    id: number;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phoneNumber: string;
    username: string;
}

export interface Account {
    id: number;
    customerId: number;
    type: number; // 0 = CHECKING, 1 = SAVINGS
    balance: number;
}

export interface BankTransaction {
    id: number;
    accountId: number;
    type: number;
    date: string;
    amount: number;
    description: string;
}

// ---------------- CUSTOMER ----------------

export async function getCustomerByUsername(username: string): Promise<Customer> {
    const out = await dbExec('customer-by-username', [username]);
    if (!out.trim()) throw new Error(`Customer "${username}" not found`);
    return parseCustomerRow(out);
}

export async function getCustomerById(id: number): Promise<Customer> {
    const out = await dbExec('customer-by-id', [String(id)]);
    if (!out.trim()) throw new Error(`Customer with id ${id} not found`);
    return parseCustomerRow(out);
}

export async function getCustomerCount(): Promise<number> {
    const out = (await dbExec('customer-count')).trim();
    return Number(out);
}

export async function customerExistsByUsername(username: string): Promise<boolean> {
    const out = (await dbExec('customer-exists-username', [username])).trim();
    return out === 'true';
}

// ---------------- ACCOUNT ----------------

const ACCOUNT_TYPE = { CHECKING: 0, SAVINGS: 1, LOAN: 2 } as const;
export const AccountType = ACCOUNT_TYPE;

export async function getAccountById(id: number): Promise<Account> {
    const out = (await dbExec('account-by-id', [String(id)])).trim();
    if (!out) throw new Error(`Account ${id} not found`);
    const [aid, cid, type, balance] = out.split('|');
    return {
        id: Number(aid),
        customerId: Number(cid),
        type: Number(type),
        balance: Number(balance),
    };
}

export async function getAccountsByCustomer(customerId: number): Promise<Account[]> {
    const out = (await dbExec('accounts-by-customer', [String(customerId)])).trim();
    if (!out) return [];
    return out.split('\n').map(line => {
        const [aid, cid, type, balance] = line.split('|');
        return {
            id: Number(aid),
            customerId: Number(cid),
            type: Number(type),
            balance: Number(balance),
        };
    });
}

export async function getAccountCountForCustomer(customerId: number): Promise<number> {
    const out = (await dbExec('account-count-by-customer', [String(customerId)])).trim();
    return Number(out);
}

export async function getAccountBalance(accountId: number): Promise<number> {
    const out = (await dbExec('account-balance', [String(accountId)])).trim();
    return Number(out);
}

// ---------------- TRANSACTION ----------------

export async function getTransactionsByAccount(accountId: number): Promise<BankTransaction[]> {
    const out = (await dbExec('transactions-by-account', [String(accountId)])).trim();
    if (!out) return [];
    return out.split('\n').map(parseTransactionRow);
}

export async function getTransactionsByCustomer(customerId: number): Promise<BankTransaction[]> {
    const out = (await dbExec('transactions-by-customer', [String(customerId)])).trim();
    if (!out) return [];
    return out.split('\n').map(parseTransactionRow);
}

export async function getTransactionCountForAccount(accountId: number): Promise<number> {
    const out = (await dbExec('transaction-count-by-account', [String(accountId)])).trim();
    return Number(out);
}

export async function getTransactionCountForCustomer(customerId: number): Promise<number> {
    const out = (await dbExec('transaction-count-by-customer', [String(customerId)])).trim();
    return Number(out);
}

export async function transferExistsForAccount(accountId: number, amount: number): Promise<boolean> {
    const out = (await dbExec('transfer-exists', [String(accountId), String(amount)])).trim();
    return out === 'true';
}

// ---------------- LOAN ----------------

export async function loanPaymentExistsForAccount(
    accountId: number,
    amount: number,
): Promise<boolean> {
    const out = (await dbExec('loan-payment-exists', [String(accountId), String(amount)])).trim();
    return out === 'true';
}

export async function loanAccountExists(
    customerId: number,
    amount: number,
): Promise<boolean> {
    const out = (await dbExec('loan-account-exists', [String(customerId), String(amount)])).trim();
    return out === 'true';
}

export async function getLoanAccountCount(customerId: number): Promise<number> {
    const out = (await dbExec('loan-accounts-by-customer', [String(customerId)])).trim();
    return Number(out);
}

// ---------------- Parsers ----------------

function parseCustomerRow(line: string): Customer {
    const [id, firstName, lastName, address, city, state, zipCode, phoneNumber, username] =
        line.trim().split('|');
    return {
        id: Number(id),
        firstName,
        lastName,
        address,
        city,
        state,
        zipCode,
        phoneNumber,
        username,
    };
}

function parseTransactionRow(line: string): BankTransaction {
    const [id, accountId, type, date, amount, description] = line.trim().split('|');
    return {
        id: Number(id),
        accountId: Number(accountId),
        type: Number(type),
        date,
        amount: Number(amount),
        description,
    };
}
