import { test, expect } from '@playwright/test';

test.describe('Mobile navigation', () => {
  test('closes the menu after navigating to settings', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Open menu' }).click();
    const menu = page.getByRole('dialog', { name: 'Navigation menu' });
    await expect(menu).toBeVisible();

    await menu.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('main').getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(menu).toBeHidden();
  });
});
