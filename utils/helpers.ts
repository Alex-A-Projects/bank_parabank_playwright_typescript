import { Page, expect } from '@playwright/test';

/**
 * Helpers shared across the test files.
 *
 * - `assertNoConsoleErrors`: fail the test if the page logged any
 *   `console.error` calls (useful for spotting client-side JS exceptions
 *   on form submissions that should succeed).
 * - `expectUrlContains` / `waitForUrl`: convenience wrappers used widely
 *   in page objects.
 */

export async function expectUrlContains(page: Page, fragment: string): Promise<void> {
  await expect(page).toHaveURL(new RegExp(fragment.replace(/\./g, '\\.')));
}

/**
 * Capture every console message of level "error" so the test can fail on
 * unexpected client-side errors.
 */
export function trackConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });
  return errors;
}

export async function assertNoConsoleErrors(errors: string[]): Promise<void> {
  // Filter out third-party noise that ParaBank loads from www.parasoft.com
  // but keep anything from the app itself.
  const appErrors = errors.filter(
    (e) =>
      !e.includes('parasoft.com') &&
      !e.includes('favicon') &&
      !e.toLowerCase().includes('net::err_blocked_by_client'),
  );
  expect(appErrors, `Unexpected client-side errors:\n${appErrors.join('\n')}`).toHaveLength(0);
}
