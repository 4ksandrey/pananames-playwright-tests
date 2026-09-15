import type { Locator, Page } from '@playwright/test';

import { parseMoney, type Money } from '../utils/money';

export class CartPage {
  readonly heading: Locator;
  readonly deleteAllItems: Locator;
  readonly emptyMessage: Locator;
  readonly registrationItemRows: Locator;
  readonly total: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: /^(?:Shopping cart|Cart is empty)$/ });
    this.deleteAllItems = page.getByText('Delete all items', { exact: true });
    this.emptyMessage = page.getByText('Cart is empty', { exact: true });
    this.registrationItemRows = page
      .getByRole('table')
      .getByRole('row')
      .filter({
        has: page.getByText(/^\s*Register\s+\S+/),
      });
    this.total = page.getByText(/^TOTAL:/);
  }

  async open(timeout?: number): Promise<void> {
    await this.page.goto('/cart', { timeout });
    await this.heading.waitFor({ timeout });
  }

  cartItemRow(domain: string): Locator {
    return this.page.getByRole('row').filter({
      has: this.page.getByText(domain, { exact: true }),
    });
  }

  async readTotal(): Promise<Money> {
    return parseMoney(await this.total.innerText());
  }

  async clear(timeout?: number): Promise<void> {
    const itemRows = this.registrationItemRows;

    await this.emptyMessage.or(itemRows.first()).first().waitFor({ timeout });

    if (await this.emptyMessage.isVisible()) {
      return;
    }

    const bulkOperations = this.page
      .getByText('Show bulk operations', { exact: true })
      .locator('..');

    if (await bulkOperations.isVisible()) {
      await bulkOperations.getByRole('switch').click({ timeout });
      await this.deleteAllItems.click({ timeout });
    } else {
      while ((await itemRows.count()) > 0) {
        const firstItemRow = itemRows.first();
        const itemText = await firstItemRow.getByRole('cell').first().innerText();
        const domain = itemText.replace(/^\s*Register\s+/, '').trim();
        const targetRow = this.cartItemRow(domain);

        // The application exposes this delete action as an unnamed icon-only button.
        await targetRow.getByRole('cell').last().getByRole('button').click({ timeout });
        await targetRow.waitFor({ state: 'hidden', timeout });
      }
    }

    await this.emptyMessage.waitFor({ timeout });
  }

  async clearForCleanup(): Promise<void> {
    const cleanupTimeout = 5_000;

    if (new URL(this.page.url()).pathname !== '/cart') {
      await this.open(cleanupTimeout);
    }

    await this.clear(cleanupTimeout);
  }
}
