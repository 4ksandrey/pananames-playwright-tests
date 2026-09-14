import type { Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(email: string, password: string): Promise<void> {
    const loginForm = this.page.locator('form');

    await loginForm.getByLabel('Email').fill(email);
    await loginForm.getByLabel('Password').fill(password);
    await loginForm.getByRole('button', { name: 'Login', exact: true }).click();
  }
}
