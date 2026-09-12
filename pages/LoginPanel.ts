import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * LoginPanel - small POM fragment that wraps the login form on the
 * right-hand panel of any unauthenticated page (home, register, etc.).
 *
 * Lives separately from HomePage because the same login form is rendered
 * on several pages and tests should not have to navigate to home first.
 */
export class LoginPanel extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('input[value="Log In"]');
  }

  async fillAndSubmit(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
