import { expect, test } from '@playwright/test';

import {
  contactSwitchLabels,
  type ContactData,
  ContactsPage,
} from '../pages/ContactsPage';
import { createContactData } from '../utils/testData';

async function expectContactFormToMatch(
  contactsPage: ContactsPage,
  expected: ContactData,
): Promise<void> {
  await expect(contactsPage.nameInput).toHaveValue(expected.name);
  await expect(contactsPage.firstNameInput).toHaveValue(expected.firstName);
  await expect(contactsPage.lastNameInput).toHaveValue(expected.lastName);
  await expect(contactsPage.emailInput).toHaveValue(expected.email);
  await expect(contactsPage.phoneNumberInput).toHaveValue(expected.phoneNumber);
  await expect(contactsPage.commentInput).toHaveValue(expected.comment);

  const expectedSwitches = [
    [contactSwitchLabels.support, expected.supportRequests],
    [contactSwitchLabels.promotional, expected.promotionalEmails],
    [contactSwitchLabels.product, expected.productEmails],
    [contactSwitchLabels.financial, expected.financialEmails],
  ] as const;

  for (const [label, checked] of expectedSwitches) {
    const contactSwitch = contactsPage.switchByLabel(label);

    if (checked) {
      await expect(contactSwitch).toBeChecked();
    } else {
      await expect(contactSwitch).not.toBeChecked();
    }
  }
}

test.describe('Contacts', () => {
  test('creates a new contact and persists its values', async ({ page }) => {
    const contactsPage = new ContactsPage(page);
    const contact = createContactData();

    try {
      await contactsPage.open();
      await contactsPage.createContact(contact);

      const contactRow = contactsPage.contactRow(contact.name);
      await expect(contactRow).toBeVisible();
      await expect(contactRow).toContainText(contact.email);

      await contactsPage.openContact(contact.name);
      await expectContactFormToMatch(contactsPage, contact);
    } finally {
      await contactsPage.deleteContactIfPresent(contact.name).catch(() => undefined);
    }
  });
});
