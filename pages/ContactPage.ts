import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * ContactPage - the static "Contact" page.
 */
export class ContactPage extends BasePage {
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('#rightPanel h1.title').first();
  }

  async open(): Promise<void> {
    await this.goto('/contact.htm');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/contact\.htm/);
    await expect(this.heading).toContainText(/Customer Care/i);
  }
}
