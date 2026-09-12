/**
 * Shared test data for the ParaBank suite.
 *
 * The demo bank ships with two seeded accounts that we can rely on
 * across test runs without re-registering every time:
 *   - john / demo
 *   - jane / demo
 *
 * For tests that register a brand-new user we generate a unique username
 * based on the current timestamp so consecutive test runs don't collide.
 */

export const TestUsers = {
  /** Pre-seeded demo user. Username and password are hard-coded by ParaBank. */
  default: {
    firstName: 'John',
    lastName: 'Smith',
    username: 'john',
    password: 'demo',
  },
  second: {
    firstName: 'Jane',
    lastName: 'Smith',
    username: 'jane',
    password: 'demo',
  },
} as const;

export const ValidCustomer = TestUsers.default;

/**
 * Generate a fresh registration payload using a timestamped username so
 * the suite can be re-run repeatedly without colliding with prior users.
 */
export function generateNewUser(prefix = 'qa') {
  const now = Date.now();
  return {
    firstName: 'Auto',
    lastName: `Tester${now}`,
    address: '123 Automation Lane',
    city: 'Testville',
    state: 'CA',
    zipCode: '94000',
    phone: '5551234567',
    ssn: '111223333',
    username: `${prefix}_${now}`,
    password: 'Passw0rd!',
    confirm: 'Passw0rd!',
  };
}

/** Standard money strings that show in the demo accounts. */
export const AccountTypes = {
  checking: 'CHECKING',
  savings: 'SAVINGS',
  loan: 'LOAN',
} as const;
