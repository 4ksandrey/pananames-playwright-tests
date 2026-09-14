import { expect, test as base } from '@playwright/test';

import { CartPage } from '../pages/CartPage';
import { ContactsPage } from '../pages/ContactsPage';
import { DomainRegistrationPage } from '../pages/DomainRegistrationPage';

type AppFixtures = {
  cartPage: CartPage;
  contactsPage: ContactsPage;
  domainRegistrationPage: DomainRegistrationPage;
};

export const test = base.extend<AppFixtures>({
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  contactsPage: async ({ page }, use) => {
    await use(new ContactsPage(page));
  },
  domainRegistrationPage: async ({ page }, use) => {
    await use(new DomainRegistrationPage(page));
  },
});

export { expect };
