import { test, expect } from '../fixtures/testFixtures';
import { UpdateContactInfoPage } from '../pages/UpdateContactInfoPage';

test.describe('Update Contact Info page', () => {
  test('the form is pre-populated with the existing profile', async ({ overviewPage, page }) => {
    await overviewPage.menuUpdateContactInfo.click();
    const profile = new UpdateContactInfoPage(page);
    await profile.assertLoaded();
    await expect(profile.firstNameInput).not.toHaveValue('', { timeout: 5_000 });

    const firstName = await profile.getCurrentFirstName();
    expect(firstName.length).toBeGreaterThan(0);
  });

  test.skip('updating the phone number shows the "Profile Updated" confirmation', async ({
    overviewPage,
    page,
  }) => {
    await overviewPage.menuUpdateContactInfo.click();
    const profile = new UpdateContactInfoPage(page);
    await profile.assertLoaded();
    await expect(profile.firstNameInput).not.toHaveValue('', { timeout: 5_000 });

    const currentFirst = await profile.firstNameInput.inputValue();
    const currentLast = await profile.lastNameInput.inputValue();
    const currentAddress = await profile.addressInput.inputValue();
    const currentCity = await profile.cityInput.inputValue();
    const currentState = await profile.stateInput.inputValue();
    const currentZip = await profile.zipCodeInput.inputValue();
    const currentPhone = await profile.phoneInput.inputValue();
    const newPhone = currentPhone === '5551234567' ? '5557654321' : '5551234567';

    await profile.updateProfile({
      firstName: currentFirst,
      lastName: currentLast,
      address: currentAddress,
      city: currentCity,
      state: currentState,
      zipCode: currentZip,
      phone: newPhone,
    });

    await profile.assertProfileUpdated();
  });
});
