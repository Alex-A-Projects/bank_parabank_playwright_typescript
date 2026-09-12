import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * AboutPage - the static "About Us" page.
 */
export class AboutPage extends BasePage {
  readonly bodyHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.bodyHeading = page.locator('#rightPanel h1.title').first();
  }

  async open(): Promise<void> {
    await this.goto('/about.htm');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/about\.htm/);
    await expect(this.bodyHeading).toContainText(/ParaSoft/i);
  }
}
