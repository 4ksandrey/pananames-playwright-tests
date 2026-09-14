import type { Locator, Page } from '@playwright/test';

import { parseMoney } from '../utils/money';

export type DomainResult = {
  domain: string;
  currency: 'USD';
  priceInMinorUnits: number;
};

export class DomainRegistrationPage {
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly resultCards: Locator;
  readonly availableResultCards: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {
      name: /Domain availability check and\s*order/,
    });
    this.searchInput = page.getByPlaceholder('Enter domain name or keyword');
    this.resultCards = page.locator('.list__item');
    this.availableResultCards = this.resultCards.filter({
      has: page.getByRole('button', { name: 'Add to cart', exact: true }),
    });
  }

  async open(): Promise<void> {
    await this.page.goto('/register-domain');
    await this.heading.waitFor();
  }

  async searchDomain(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.resultCards.first().waitFor();
  }

  resultCard(domain: string): Locator {
    return this.resultCards.filter({
      has: this.page.getByText(domain, { exact: true }),
    });
  }

  async readDomainResult(card: Locator): Promise<DomainResult> {
    const domain = (await card.locator('.domain-name').innerText()).replaceAll(/\s/g, '').toLowerCase();
    const priceText = await card.locator('span.text-right.text-gray-900').last().innerText();
    const price = parseMoney(priceText);

    return {
      domain,
      currency: price.currency,
      priceInMinorUnits: price.minorUnits,
    };
  }

  async addDomainToCart(domain: string): Promise<void> {
    const card = this.resultCard(domain);
    const addedIndicator = card.getByText('Added to cart', { exact: true });
    const registrationNoticeButton = this.page.getByRole('button', {
      name: 'I AGREE, ADD DOMAIN TO CART',
      exact: true,
    });
    const trademarkAcknowledgement = this.page.getByRole('checkbox', {
      name: 'I have reviewed trademark notice, understand it and will not infringe on the trademark rights.',
      exact: true,
    });

    await card.getByRole('button', { name: 'Add to cart', exact: true }).click();
    await addedIndicator.or(registrationNoticeButton).or(trademarkAcknowledgement).first().waitFor();

    if (await registrationNoticeButton.isVisible()) {
      await registrationNoticeButton.click();
      await addedIndicator.or(trademarkAcknowledgement).first().waitFor();
    }

    if (await trademarkAcknowledgement.isVisible()) {
      await trademarkAcknowledgement.check();
      await this.page
        .getByRole('button', { name: 'I DO CONFIRM, ADD DOMAIN TO CART', exact: true })
        .click();
    }

    await addedIndicator.waitFor();
  }

  async openCart(): Promise<void> {
    await this.page.getByRole('button', { name: 'Proceed to Cart' }).click();
    await this.page.waitForURL(/\/cart(?:[?#].*)?$/);
  }
}
