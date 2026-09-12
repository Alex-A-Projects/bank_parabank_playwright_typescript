import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * AdminPage - /parabank/admin.htm
 *
 * Lets you toggle JMS and JDBC service mode and reset the demo database
 * from the standard admin link in the header. JMS uses a dropdown, JDBC
 * uses radio buttons; RESET is a submit button with action=CLEAN.
 */
export class AdminPage extends BasePage {
  readonly heading: Locator;
  readonly jmsModeDropdown: Locator;
  readonly jdbcRadioSoap: Locator;
  readonly jdbcRadioRestXml: Locator;
  readonly jdbcRadioRestJson: Locator;
  readonly jdbcRadioJdbc: Locator;
  readonly submitButton: Locator;
  readonly initButton: Locator;
  readonly cleanButton: Locator;
  readonly resetButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('#rightPanel h1.title').first();
    this.jmsModeDropdown = page.locator('select#loanProvider, select[name="loanProvider"]');
    this.jdbcRadioSoap = page.locator('input#accessMode1');
    this.jdbcRadioRestXml = page.locator('input#accessMode2');
    this.jdbcRadioRestJson = page.locator('input#accessMode3');
    this.jdbcRadioJdbc = page.locator('input#accessMode4');
    this.submitButton = page.locator('input[value="Submit"]');
    this.initButton = page.locator('button[name="action"][value="INIT"]');
    this.cleanButton = page.locator('button[name="action"][value="CLEAN"]');
    this.resetButton = this.cleanButton;
  }

  async open(): Promise<void> {
    await this.goto('/admin.htm');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/admin\.htm/);
    await expect(this.heading).toBeVisible();
    await expect(this.jdbcRadioSoap).toBeVisible();
    await expect(this.jdbcRadioJdbc).toBeVisible();
    await expect(this.submitButton).toBeVisible();
    await expect(this.cleanButton).toBeVisible();
  }
}
