import type { Locator, Page } from '@playwright/test';

import { parseMoney, type Money } from '../utils/money';

export class CartPage {
  readonly heading: Locator;
  readonly deleteAllItems: Locator;
  readonly emptyMessage: Locator;
  readonly total: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Shopping cart', exact: true });
    this.deleteAllItems = page.getByText('Delete all items', { exact: true });
    this.emptyMessage = page.getByText('Cart is empty', { exact: true });
    this.total = page.getByText(/^TOTAL:/);
  }

  async open(): Promise<void> {
    await this.page.goto('/cart');
    await this.heading.waitFor();
  }

  cartItemRow(domain: string): Locator {
    return this.page.getByRole('row').filter({
      has: this.page.getByText(domain, { exact: true }),
    });
  }

  async readTotal(): Promise<Money> {
    return parseMoney(await this.total.innerText());
  }

  async clear(): Promise<void> {
    await this.deleteAllItems.or(this.emptyMessage).first().waitFor();

    if (await this.deleteAllItems.isVisible()) {
      await this.deleteAllItems.click();
      await this.emptyMessage.waitFor();
    }
  }
}
