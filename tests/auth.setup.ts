import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

import { expect, test as setup } from '@playwright/test';

import { LoginPage } from '../pages/LoginPage';
import { authStatePath } from '../utils/paths';

function requireEnvironmentVariable(name: 'PANANAMES_EMAIL' | 'PANANAMES_PASSWORD'): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required. Copy .env.example to .env and provide a value.`);
  }

  return value;
}

setup('authenticate', async ({ page }) => {
  const email = requireEnvironmentVariable('PANANAMES_EMAIL');
  const password = requireEnvironmentVariable('PANANAMES_PASSWORD');
  const loginPage = new LoginPage(page);

  await loginPage.open();
  await loginPage.login(email, password);
  await expect(page).toHaveURL(/\/domains(?:[/?#]|$)/);

  await mkdir(dirname(authStatePath), { recursive: true });
  await page.context().storageState({ path: authStatePath });
});
