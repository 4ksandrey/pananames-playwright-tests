import { expect, test } from '@playwright/test';

import { CartPage } from '../pages/CartPage';
import { DomainRegistrationPage } from '../pages/DomainRegistrationPage';
import { createDomainSld } from '../utils/testData';

const supportedTlds = ['com', 'net', 'org'] as const;

test.describe('Single domain cart total', () => {
  for (const tld of supportedTlds) {
    test(`single domain total matches search price for .${tld}`, async ({ page }) => {
      const cartPage = new CartPage(page);
      const registrationPage = new DomainRegistrationPage(page);
      const domain = `${createDomainSld()}.${tld}`;

      try {
        await cartPage.open();
        await cartPage.clear();
        await registrationPage.open();
        await registrationPage.searchDomain(domain);

        const resultCard = registrationPage.resultCard(domain);
        await expect(
          resultCard.getByRole('button', { name: 'Add to cart', exact: true }),
        ).toBeVisible();

        const searchResult = await registrationPage.readDomainResult(resultCard);
        expect(searchResult.domain).toBe(domain);

        await registrationPage.addDomainToCart(domain);
        await registrationPage.openCart();

        await expect(cartPage.cartItemRow(domain)).toBeVisible();
        const cartTotal = await cartPage.readTotal();
        expect(cartTotal.currency).toBe(searchResult.currency);
        expect(cartTotal.minorUnits).toBe(searchResult.priceInMinorUnits);
      } finally {
        await cartPage
          .open()
          .then(() => cartPage.clear())
          .catch((error) => console.warn('Cart cleanup failed after single-domain test.', error));
      }
    });
  }
});
