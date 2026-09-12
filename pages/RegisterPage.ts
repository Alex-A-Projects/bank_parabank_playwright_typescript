import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export type NewUserPayload = {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  ssn: string;
  username: string;
  password: string;
  confirm: string;
};

/**
 * RegisterPage - the new-account registration form at /parabank/register.htm.
 *
 * Captures every form field by name and exposes both a "fill everything at
 * once" helper (`register`) and granular setters used by negative tests.
 */
export class RegisterPage extends BasePage {
  readonly heading: Locator;

  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly addressInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly zipCodeInput: Locator;
  readonly phoneInput: Locator;
  readonly ssnInput: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmInput: Locator;

  readonly registerButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('#rightPanel h1.title').first();

    this.firstNameInput = page.locator('input#customer\\.firstName, input[name="customer.firstName"]');
    this.lastNameInput = page.locator('input#customer\\.lastName, input[name="customer.lastName"]');
    this.addressInput = page.locator('input#customer\\.address\\.street, input[name="customer.address.street"]');
    this.cityInput = page.locator('input#customer\\.address\\.city, input[name="customer.address.city"]');
    this.stateInput = page.locator('input#customer\\.address\\.state, input[name="customer.address.state"]');
    this.zipCodeInput = page.locator('input#customer\\.address\\.zipCode, input[name="customer.address.zipCode"]');
    this.phoneInput = page.locator('input#customer\\.phoneNumber, input[name="customer.phoneNumber"]');
    this.ssnInput = page.locator('input#customer\\.ssn, input[name="customer.ssn"]');
    this.usernameInput = page.locator('input#customer\\.username, input[name="customer.username"]');
    this.passwordInput = page.locator('input#customer\\.password, input[name="customer.password"]');
    this.confirmInput = page.locator('input#repeatedPassword, input[name="repeatedPassword"]');

    this.registerButton = page.locator('input[value="Register"]');
  }

  async open(): Promise<void> {
    await this.goto('/register.htm');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/register\.htm/);
    await expect(this.heading).toContainText(/Signing up is easy/i);
    await expect(this.firstNameInput).toBeVisible();
    await expect(this.lastNameInput).toBeVisible();
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.confirmInput).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }

  async register(user: NewUserPayload): Promise<void> {
    await this.firstNameInput.fill(user.firstName);
    await this.lastNameInput.fill(user.lastName);
    await this.addressInput.fill(user.address);
    await this.cityInput.fill(user.city);
    await this.stateInput.fill(user.state);
    await this.zipCodeInput.fill(user.zipCode);
    await this.phoneInput.fill(user.phone);
    await this.ssnInput.fill(user.ssn);
    await this.usernameInput.fill(user.username);
    await this.passwordInput.fill(user.password);
    await this.confirmInput.fill(user.confirm);
    await this.registerButton.click();
  }
}
