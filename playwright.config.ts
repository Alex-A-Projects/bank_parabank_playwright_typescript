import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the ParaBank test suite.
 * - Tests are organised under `tests/` and use the Page Object Model under `pages/`.
 * - Most tests run serially because they share the demo user state from
 *   https://parabank.parasoft.com (the seed account data resets slowly).
 */
export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  timeout: 120_000,
  expect: {
    timeout: 10_000,
  },
  /**
   * Slow down slightly between tests to avoid tripping Cloudflare's
   * rate limit on parasoft.com. Default is 0; set to ~750ms to stay
   * safely below the threshold while still running quickly overall.
   */
  reportSlowTests: { max: 5, threshold: 30_000 },
  use: {
    baseURL: 'https://parabank.parasoft.com/parabank',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
