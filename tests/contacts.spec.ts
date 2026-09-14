import { expect, test } from '@playwright/test';

import { contactSwitchLabels, type ContactData, ContactsPage } from '../pages/ContactsPage';
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
    const contactSwitch = contactsPage.checkboxByLabel(label);

    if (checked) {
      await expect(contactSwitch).toBeChecked();
    } else {
      await expect(contactSwitch).not.toBeChecked();
    }
  }
}

async function cleanupContact(contactsPage: ContactsPage, name: string): Promise<void> {
  try {
    await contactsPage.deleteContactIfPresent(name);
  } catch (error) {
    console.warn(`Cleanup failed for contact "${name}".`, error);
  }
}

test.describe('Contacts', () => {
  test('creates a new contact and persists its values', async ({ page }) => {
    const contactsPage = new ContactsPage(page);
    const contact = createContactData();

    try {
      await test.step('Create contact', async () => {
        await contactsPage.open();
        await contactsPage.createContact(contact);
      });

      await test.step('Verify contact in list', async () => {
        const contactRow = contactsPage.contactRow(contact.name);
        await expect(contactRow).toBeVisible();
        await expect(contactRow).toContainText(contact.email);
      });

      await test.step('Verify persisted contact details', async () => {
        await contactsPage.openContact(contact.name);
        await expectContactFormToMatch(contactsPage, contact);
      });
    } finally {
      await cleanupContact(contactsPage, contact.name);
    }
  });

  test('edits its own disposable contact and persists changed values', async ({ page }) => {
    const contactsPage = new ContactsPage(page);
    const originalContact = createContactData();
    const editedContact: ContactData = {
      ...originalContact,
      firstName: 'UpdatedQA',
      lastName: 'UpdatedAutomation',
      comment: 'Updated by an isolated Playwright scenario',
      supportRequests: false,
      promotionalEmails: true,
      productEmails: false,
      financialEmails: true,
    };

    try {
      await test.step('Create contact for editing', async () => {
        await contactsPage.open();
        await contactsPage.createContact(originalContact);
      });

      await test.step('Edit contact', async () => {
        await contactsPage.openContact(originalContact.name);
        await contactsPage.editContact(editedContact);
      });

      await test.step('Verify persisted contact changes', async () => {
        await expect(contactsPage.contactRow(editedContact.name)).toBeVisible();
        await contactsPage.openContact(editedContact.name);
        await expectContactFormToMatch(contactsPage, editedContact);
      });
    } finally {
      await cleanupContact(contactsPage, originalContact.name);
    }
  });

  test('deletes its own disposable contact', async ({ page }) => {
    const contactsPage = new ContactsPage(page);
    const contact = createContactData();

    try {
      await test.step('Create contact for deletion', async () => {
        await contactsPage.open();
        await contactsPage.createContact(contact);
      });

      await test.step('Delete contact and verify removal', async () => {
        const contactRow = contactsPage.contactRow(contact.name);
        await expect(contactRow).toBeVisible();
        await contactsPage.deleteContact(contact.name);
        await expect(contactRow).toBeHidden();
      });
    } finally {
      await cleanupContact(contactsPage, contact.name);
    }
  });
});
