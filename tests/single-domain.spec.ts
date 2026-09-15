import { expect, test } from '../fixtures/test';

import type { DomainRegistrationPage, DomainResult } from '../pages/DomainRegistrationPage';
import { createDomainSld } from '../utils/testData';

const supportedTlds = ['com', 'net', 'org'] as const;
const maximumCandidateAttempts = 4;

type AvailableDomainSelection = {
  attemptedDomains: string[];
  result: DomainResult;
};

async function findAvailableDomainForTld(
  registrationPage: DomainRegistrationPage,
  tld: (typeof supportedTlds)[number],
): Promise<AvailableDomainSelection> {
  const attemptedDomains: string[] = [];

  for (let attempt = 1; attempt <= maximumCandidateAttempts; attempt += 1) {
    const domain = `${createDomainSld()}${attempt}.${tld}`;
    attemptedDomains.push(domain);
    await registrationPage.searchDomain(domain);

    if (await registrationPage.isDomainAvailable(domain)) {
      return {
        attemptedDomains,
        result: await registrationPage.readDomain(domain),
      };
    }
  }

  throw new Error(
    `No available .${tld} domain found after ${maximumCandidateAttempts} unique attempts. ` +
      `Tried: ${attemptedDomains.join(', ')}`,
  );
}

test.describe('Single domain cart total', () => {
  for (const tld of supportedTlds) {
    test(`single domain total matches search price for .${tld}`, async ({
      cartPage,
      domainRegistrationPage: registrationPage,
    }, testInfo) => {
      try {
        await test.step('Prepare empty cart', async () => {
          await cartPage.open();
          await cartPage.clear();
        });

        const selection = await test.step(`Find available .${tld} domain`, async () => {
          await registrationPage.open();
          const availableSelection = await findAvailableDomainForTld(registrationPage, tld);

          expect(availableSelection.result.domain).toBe(availableSelection.attemptedDomains.at(-1));
          await testInfo.attach('domain-test-data', {
            body: JSON.stringify(
              {
                attemptedDomains: availableSelection.attemptedDomains,
                domain: availableSelection.result.domain,
                searchPriceInMinorUnits: availableSelection.result.priceInMinorUnits,
                currency: availableSelection.result.currency,
              },
              null,
              2,
            ),
            contentType: 'application/json',
          });

          return availableSelection;
        });

        await test.step('Add domain to cart', async () => {
          await registrationPage.addDomainToCart(selection.result.domain);
        });

        await test.step('Verify exact cart contents', async () => {
          await registrationPage.openCart();
          await expect(cartPage.registrationItemRows).toHaveCount(1);
          await expect(cartPage.cartItemRow(selection.result.domain)).toBeVisible();
        });

        await test.step('Verify total matches the search price', async () => {
          const cartTotal = await cartPage.readTotal();
          expect(cartTotal.currency).toBe(selection.result.currency);
          expect(cartTotal.minorUnits).toBe(selection.result.priceInMinorUnits);
        });
      } finally {
        await cartPage
          .clearForCleanup()
          .catch((error) => console.warn('Cart cleanup failed after single-domain test.', error));
      }
    });
  }
});
