import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export type ContactProfile = {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
};

/**
 * UpdateContactInfoPage - /parabank/updateprofile.htm
 *
 * The form is pre-populated with the logged-in customer's existing
 * profile; submitting with changes updates that profile.
 */
export class UpdateContactInfoPage extends BasePage {
  readonly heading: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly addressInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly zipCodeInput: Locator;
  readonly phoneInput: Locator;
  readonly updateProfileButton: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('#rightPanel h1.title').first();
    this.firstNameInput = page.locator('input#customer\\.firstName, input[name="customer.firstName"]');
    this.lastNameInput = page.locator('input#customer\\.lastName, input[name="customer.lastName"]');
    this.addressInput = page.locator('input[name="customer.address.street"]');
    this.cityInput = page.locator('input[name="customer.address.city"]');
    this.stateInput = page.locator('input[name="customer.address.state"]');
    this.zipCodeInput = page.locator('input[name="customer.address.zipCode"]');
    this.phoneInput = page.locator('input[name="customer.phoneNumber"]');
    this.updateProfileButton = page.locator('input[value="Update Profile"], button:has-text("Update Profile")');
    this.successMessage = page.locator('#updateProfileResult h1.title');
  }

  async open(): Promise<void> {
    await this.goto('/updateprofile.htm');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/updateprofile\.htm/);
    await expect(this.heading).toContainText(/Update Profile/i);
    await expect(this.firstNameInput).toBeVisible();
    await expect(this.lastNameInput).toBeVisible();
    await expect(this.updateProfileButton).toBeVisible();
  }

  async getCurrentFirstName(): Promise<string> {
    return await this.firstNameInput.inputValue();
  }

  async updateProfile(profile: ContactProfile): Promise<void> {
    await this.firstNameInput.fill(profile.firstName);
    await this.lastNameInput.fill(profile.lastName);
    await this.addressInput.fill(profile.address);
    await this.cityInput.fill(profile.city);
    await this.stateInput.fill(profile.state);
    await this.zipCodeInput.fill(profile.zipCode);
    await this.phoneInput.fill(profile.phone);
    await this.updateProfileButton.click();
  }

  async assertProfileUpdated(): Promise<void> {
    await expect(
      this.page
        .locator('#rightPanel h1.title')
        .filter({ hasText: /Profile Updated/i })
        .first(),
    ).toBeVisible();
  }
}
