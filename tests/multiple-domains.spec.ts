import { expect, test } from '../fixtures/test';

import { createDomainSld } from '../utils/testData';

test('multiple domain total matches the sum of exactly three available results', async ({
  cartPage,
  domainRegistrationPage: registrationPage,
}) => {
  const sld = createDomainSld();

  try {
    await cartPage.open();
    await cartPage.clear();
    await registrationPage.open();
    await registrationPage.searchDomain(sld);

    await expect
      .poll(() => registrationPage.availableResultCards.count())
      .toBeGreaterThanOrEqual(3);

    const availableCards = await registrationPage.availableResultCards.all();
    const selectedCards = availableCards.slice(0, 3);
    const selectedResults = await Promise.all(
      selectedCards.map((card) => registrationPage.readDomainResult(card)),
    );

    expect(selectedResults).toHaveLength(3);
    expect(new Set(selectedResults.map(({ domain }) => domain)).size).toBe(3);
    expect(new Set(selectedResults.map(({ currency }) => currency)).size).toBe(1);

    for (const { domain } of selectedResults) {
      await registrationPage.addDomainToCart(domain);
    }

    await registrationPage.openCart();

    for (const { domain } of selectedResults) {
      await expect(cartPage.cartItemRow(domain)).toBeVisible();
    }

    const expectedTotalInMinorUnits = selectedResults.reduce(
      (total, result) => total + result.priceInMinorUnits,
      0,
    );
    const cartTotal = await cartPage.readTotal();
    expect(cartTotal.currency).toBe(selectedResults[0].currency);
    expect(cartTotal.minorUnits).toBe(expectedTotalInMinorUnits);
  } finally {
    await cartPage
      .clearForCleanup()
      .catch((error) => console.warn('Cart cleanup failed after multiple-domain test.', error));
  }
});
