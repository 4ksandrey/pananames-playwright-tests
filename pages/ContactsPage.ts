import type { Locator, Page } from '@playwright/test';

export const contactSwitchLabels = {
  support:
    'Allow Support Requests (we will process any request for modification of domain names on this Company account made by this contact)',
  promotional: 'Send promotional emails (usually once a month)',
  product: 'Send product emails (domain registrations, renewals, failures, etc.)',
  financial: 'Send financial emails (balance notifications)',
} as const;

export type ContactData = {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phonePrefix: string;
  phoneNumber: string;
  comment: string;
  supportRequests: boolean;
  promotionalEmails: boolean;
  productEmails: boolean;
  financialEmails: boolean;
};

export class ContactsPage {
  readonly heading: Locator;
  readonly addContactButton: Locator;
  readonly nameInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phonePrefixSelect: Locator;
  readonly phoneNumberInput: Locator;
  readonly commentInput: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Contacts', exact: true });
    this.addContactButton = page.getByRole('button', { name: 'Add New Contact' });
    this.nameInput = this.textInputByVisibleLabel('Contact type/NAME');
    this.firstNameInput = this.textInputByVisibleLabel('First Name');
    this.lastNameInput = this.textInputByVisibleLabel('Last Name');
    this.emailInput = this.textInputByVisibleLabel('Email');
    this.phonePrefixSelect = this.textInputByVisibleLabel('Phone prefix*');
    this.phoneNumberInput = this.textInputByVisibleLabel('Phone number');
    this.commentInput = this.textInputByVisibleLabel('Comment (optional)');
  }

  async open(): Promise<void> {
    await this.page.goto('/contacts');
    await this.heading.waitFor();
  }

  contactRow(name: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByText(name, { exact: true }) });
  }

  checkboxByLabel(label: string): Locator {
    return this.page.getByRole('checkbox', { name: label, exact: true });
  }

  async createContact(data: ContactData): Promise<void> {
    await this.addContactButton.click();
    await this.page.getByRole('heading', { name: 'Create new contact' }).waitFor();
    await this.fillContactForm(data);
    await this.page.getByRole('button', { name: 'Create', exact: true }).click();
    await this.page.waitForURL(/\/contacts(?:[?#].*)?$/);
  }

  async openContact(name: string): Promise<void> {
    const row = this.contactRow(name);
    await row.getByRole('button').first().click();
    await this.page.getByRole('heading', { name: 'Edit contact' }).waitFor();
  }

  async editContact(data: ContactData): Promise<void> {
    await this.fillContactForm(data);
    await this.page.getByRole('button', { name: 'Save', exact: true }).click();
    await this.page.waitForURL(/\/contacts(?:[?#].*)?$/);
  }

  async deleteContact(name: string): Promise<void> {
    if (['primary', 'abuse'].includes(name.trim().toLowerCase())) {
      throw new Error(`Refusing to delete the protected ${name} contact.`);
    }

    const row = this.contactRow(name);
    await row.getByRole('button').last().click();

    const dialog = this.page.getByRole('dialog');
    await dialog.getByText('Are you sure you want to delete this contact?').waitFor();
    await dialog.getByRole('button', { name: 'OK', exact: true }).click();
  }

  async deleteContactIfPresent(name: string): Promise<void> {
    await this.open();
    const row = this.contactRow(name);

    if (await row.isVisible()) {
      await this.deleteContact(name);
      await row.waitFor({ state: 'hidden' });
    }
  }

  private async fillContactForm(data: ContactData): Promise<void> {
    await this.nameInput.fill(data.name);
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.emailInput.fill(data.email);
    await this.selectPhonePrefix(data.phonePrefix);
    await this.phoneNumberInput.fill(data.phoneNumber);
    await this.commentInput.fill(data.comment);
    await this.checkboxByLabel(contactSwitchLabels.support).setChecked(data.supportRequests);
    await this.checkboxByLabel(contactSwitchLabels.promotional).setChecked(data.promotionalEmails);
    await this.checkboxByLabel(contactSwitchLabels.product).setChecked(data.productEmails);
    await this.checkboxByLabel(contactSwitchLabels.financial).setChecked(data.financialEmails);
  }

  private async selectPhonePrefix(prefix: string): Promise<void> {
    await this.phonePrefixSelect.click();
    await this.page
      .getByRole('listitem')
      .filter({ hasText: new RegExp(`^\\s*Ukraine\\s+\\+${prefix}\\s*$`) })
      .click();
  }

  private textInputByVisibleLabel(label: string): Locator {
    return this.page
      .locator('div.relative')
      .filter({ has: this.page.getByText(label, { exact: true }) })
      .getByRole('textbox');
  }
}
