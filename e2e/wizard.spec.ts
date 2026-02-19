import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the homepage with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Bitcoin Will/);
  });

  test('should have main navigation elements', async ({ page }) => {
    await expect(page.getByText('Bitcoin Will')).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Spending Plan/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /How It Works/i })).toBeVisible();
  });

  test('should navigate to create wizard when clicking Create button', async ({ page }) => {
    await page.getByRole('button', { name: /Create Spending Plan/i }).click();
    await expect(page.getByText('New Spending Plan')).toBeVisible();
    await expect(page.getByText('Step 1 of 4')).toBeVisible();
  });

  test('should display feature cards', async ({ page }) => {
    await expect(page.getByText('For Holders')).toBeVisible();
    await expect(page.getByText('Purely Native')).toBeVisible();
    await expect(page.getByText('Simple Recovery')).toBeVisible();
  });
});

test.describe('Wizard - Type Step', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Create Spending Plan/i }).click();
  });

  test('should display type selection step', async ({ page }) => {
    await expect(page.getByText('Choose your inheritance strategy')).toBeVisible();
    await expect(page.getByText('Timelock Recovery')).toBeVisible();
  });

  test('should toggle Taproot address format', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /Toggle Taproot address format/i });
    await expect(toggle).toBeVisible();
    await toggle.click();
  });

  test('should proceed to keys step', async ({ page }) => {
    await page.getByRole('button', { name: /Continue/i }).click();
    await expect(page.getByText('Identify the players')).toBeVisible();
    await expect(page.getByText('Step 2 of 4')).toBeVisible();
  });
});

test.describe('Wizard - Keys Step', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Create Spending Plan/i }).click();
    await page.getByRole('button', { name: /Continue/i }).click();
  });

  test('should display key input fields', async ({ page }) => {
    await expect(page.getByLabel(/Owner Public Key/i)).toBeVisible();
    await expect(page.getByLabel(/Beneficiary Public Key/i)).toBeVisible();
  });

  test('should show validation error for invalid public key', async ({ page }) => {
    await page.getByLabel(/Owner Public Key/i).fill('invalid');
    await page.getByRole('button', { name: /Continue/i }).click();
    await expect(page.getByText(/Invalid public key format/i)).toBeVisible();
  });

  test('should accept sample keys on testnet', async ({ page }) => {
    await page.getByRole('button', { name: /Use Sample/i }).first().click();
    await page.getByRole('button', { name: /Use Sample/i }).nth(1).click();
    await page.getByRole('button', { name: /Continue/i }).click();
    await expect(page.getByText('Set the Delay')).toBeVisible();
  });
});

test.describe('Wizard - Timelock Step', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Create Spending Plan/i }).click();
    await page.getByRole('button', { name: /Continue/i }).click();
    await page.getByRole('button', { name: /Use Sample/i }).first().click();
    await page.getByRole('button', { name: /Use Sample/i }).nth(1).click();
    await page.getByRole('button', { name: /Continue/i }).click();
  });

  test('should display timelock slider', async ({ page }) => {
    await expect(page.getByText('Set the Delay')).toBeVisible();
    await expect(page.getByLabel(/Timelock blocks/i)).toBeVisible();
  });

  test('should proceed to review step', async ({ page }) => {
    await page.getByRole('button', { name: /Continue/i }).click();
    await expect(page.getByText('Final Review')).toBeVisible();
    await expect(page.getByText('Step 4 of 4')).toBeVisible();
  });
});

test.describe('Wizard - Review & Generate', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Create Spending Plan/i }).click();
    await page.getByRole('button', { name: /Continue/i }).click();
    await page.getByRole('button', { name: /Use Sample/i }).first().click();
    await page.getByRole('button', { name: /Use Sample/i }).nth(1).click();
    await page.getByRole('button', { name: /Continue/i }).click();
    await page.getByRole('button', { name: /Continue/i }).click();
  });

  test('should display review information', async ({ page }) => {
    await expect(page.getByText('Final Review')).toBeVisible();
    await expect(page.getByText(/Network/i)).toBeVisible();
    await expect(page.getByText(/Delay Settings/i)).toBeVisible();
  });

  test('should generate plan successfully', async ({ page }) => {
    await page.getByRole('button', { name: /Generate Plan/i }).click();
    await expect(page.getByText('Plan Secured')).toBeVisible();
    await expect(page.getByText(/Vault Address/i)).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should navigate to Learn page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /How It Works/i }).click();
    await expect(page.getByText('How Bitcoin Will Works')).toBeVisible();
  });

  test('should navigate back from wizard', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Create Spending Plan/i }).click();
    await page.getByRole('button', { name: /Cancel/i }).click();
    await expect(page.getByRole('button', { name: /Create Spending Plan/i })).toBeVisible();
  });
});
