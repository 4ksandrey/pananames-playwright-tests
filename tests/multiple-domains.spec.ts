import { expect, test } from '../fixtures/test';

import type { DomainRegistrationPage, DomainResult } from '../pages/DomainRegistrationPage';
import { createDomainSld } from '../utils/testData';

const requiredDomainCount = 3;
const maximumCandidateAttempts = 4;

type SldAttempt = {
  availableDomainCount: number;
  sld: string;
};

type AvailableDomainsSelection = {
  attempts: SldAttempt[];
  results: DomainResult[];
};

async function findSldWithAvailableDomains(
  registrationPage: DomainRegistrationPage,
): Promise<AvailableDomainsSelection> {
  const attempts: SldAttempt[] = [];

  for (let attempt = 1; attempt <= maximumCandidateAttempts; attempt += 1) {
    const sld = `${createDomainSld()}${attempt}`;
    await registrationPage.searchDomain(sld);
    const availableResults = await registrationPage.readAvailableDomainResults(sld);
    attempts.push({ sld, availableDomainCount: availableResults.length });

    if (availableResults.length >= requiredDomainCount) {
      return {
        attempts,
        results: availableResults.slice(0, requiredDomainCount),
      };
    }
  }

  const diagnostic = attempts
    .map(({ sld, availableDomainCount }) => `${sld}: ${availableDomainCount}`)
    .join(', ');
  throw new Error(
    `No SLD produced ${requiredDomainCount} available domains after ` +
      `${maximumCandidateAttempts} unique attempts. Available counts: ${diagnostic}`,
  );
}

test('multiple domain total matches the sum of exactly three available results', async ({
  cartPage,
  domainRegistrationPage: registrationPage,
}, testInfo) => {
  try {
    await test.step('Prepare empty cart', async () => {
      await cartPage.open();
      await cartPage.clear();
    });

    const selection =
      await test.step('Find SLD with at least three available domains', async () => {
        await registrationPage.open();
        const availableSelection = await findSldWithAvailableDomains(registrationPage);
        const uniqueDomains = new Set(availableSelection.results.map(({ domain }) => domain));
        const currencies = new Set(availableSelection.results.map(({ currency }) => currency));
        const expectedTotalInMinorUnits = availableSelection.results.reduce(
          (total, result) => total + result.priceInMinorUnits,
          0,
        );

        expect(availableSelection.results).toHaveLength(requiredDomainCount);
        expect(uniqueDomains.size).toBe(requiredDomainCount);
        expect(currencies.size).toBe(1);
        await testInfo.attach('domain-test-data', {
          body: JSON.stringify(
            {
              attempts: availableSelection.attempts,
              domains: availableSelection.results.map(({ domain }) => domain),
              searchPricesInMinorUnits: availableSelection.results.map(
                ({ priceInMinorUnits }) => priceInMinorUnits,
              ),
              expectedTotalInMinorUnits,
              currency: availableSelection.results[0].currency,
            },
            null,
            2,
          ),
          contentType: 'application/json',
        });

        return availableSelection;
      });

    await test.step('Add three domains to cart', async () => {
      for (const { domain } of selection.results) {
        await registrationPage.addDomainToCart(domain);
      }
    });

    await test.step('Verify exact cart contents', async () => {
      await registrationPage.openCart();
      await expect(cartPage.registrationItemRows).toHaveCount(requiredDomainCount);

      for (const { domain } of selection.results) {
        await expect(cartPage.cartItemRow(domain)).toBeVisible();
      }
    });

    await test.step('Verify calculated total', async () => {
      const expectedTotalInMinorUnits = selection.results.reduce(
        (total, result) => total + result.priceInMinorUnits,
        0,
      );
      const cartTotal = await cartPage.readTotal();

      expect(cartTotal.currency).toBe(selection.results[0].currency);
      expect(cartTotal.minorUnits).toBe(expectedTotalInMinorUnits);
    });
  } finally {
    await cartPage
      .clearForCleanup()
      .catch((error) => console.warn('Cart cleanup failed after multiple-domain test.', error));
  }
});
