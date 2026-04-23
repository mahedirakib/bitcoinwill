import { test, expect, type Page } from '@playwright/test';

const startWizard = async (page: Page) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Create Spending Plan/i }).click();
};

const continueFromTypeStep = async (page: Page) => {
  await startWizard(page);
  await page.getByRole('button', { name: /Continue/i }).click();
};

const continueWithSampleKeys = async (page: Page) => {
  await continueFromTypeStep(page);
  await page.getByRole('button', { name: /Use Sample/i }).first().click();
  await page.getByRole('button', { name: /Use Sample/i }).nth(1).click();
  await page.getByRole('button', { name: /Continue/i }).click();
};

const continueToReview = async (page: Page) => {
  await continueWithSampleKeys(page);
  await page.getByRole('button', { name: /Continue/i }).click();
};

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the homepage with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Bitcoin Will/);
  });

  test('should have main navigation elements', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Go to home/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Create Spending Plan/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Learn How It Works/i })).toBeVisible();
  });

  test('should navigate to create wizard when clicking Create link', async ({ page }) => {
    await page.getByRole('link', { name: /Create Spending Plan/i }).click();
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
    await startWizard(page);
  });

  test('should display type selection step', async ({ page }) => {
    await expect(page.getByText('Choose your inheritance strategy')).toBeVisible();
    await expect(page.getByText('Timelock Recovery')).toBeVisible();
  });

  test('should toggle Taproot address format', async ({ page }) => {
    const toggle = page.getByRole('switch', { name: /Toggle Taproot address format/i });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  test('should proceed to keys step', async ({ page }) => {
    await page.getByRole('button', { name: /Continue/i }).click();
    await expect(page.getByText('Identify the players')).toBeVisible();
    await expect(page.getByText('Step 2 of 4')).toBeVisible();
  });
});

test.describe('Wizard - Keys Step', () => {
  test.beforeEach(async ({ page }) => {
    await continueFromTypeStep(page);
  });

  test('should display key input fields', async ({ page }) => {
    await expect(page.getByLabel(/Owner Public Key/i)).toBeVisible();
    await expect(page.getByLabel(/Beneficiary Public Key/i)).toBeVisible();
  });

  test('should show validation error for invalid public key', async ({ page }) => {
    await page.getByLabel(/Owner Public Key/i).fill('invalid');
    await page.getByRole('button', { name: /Continue/i }).click();
    await expect(page.getByText('Invalid public key format (must be 66 hex characters).')).toBeVisible();
  });

  test('should accept sample keys on testnet', async ({ page }) => {
    await page.getByRole('button', { name: /Use Sample/i }).first().click();
    await page.getByRole('button', { name: /Use Sample/i }).nth(1).click();
    await page.getByRole('button', { name: /Continue/i }).click();
    await expect(page.getByText('Set the Delay')).toBeVisible();
  });
});

test.describe('Wizard - Social Recovery', () => {
  test('should generate a social recovery plan with an app-generated beneficiary key', async ({ page }) => {
    await startWizard(page);
    await page.getByRole('switch', { name: /Toggle social recovery/i }).click();
    await page.getByRole('button', { name: /2-of-3 Shares/i }).click();
    await page.getByRole('button', { name: /Continue/i }).click();

    await expect(page.getByText('Owner Identification')).toBeVisible();
    await expect(page.getByLabel(/Owner Public Key/i)).toBeVisible();
    await expect(page.getByLabel(/Beneficiary Public Key/i)).toBeHidden();

    await page.getByRole('button', { name: /Use Sample/i }).click();
    await page.getByRole('button', { name: /Continue/i }).click();
    await expect(page.getByText('Set the Delay')).toBeVisible();

    await page.getByRole('button', { name: /Continue/i }).click();
    await expect(page.getByText('Final Review')).toBeVisible();

    await page.getByRole('button', { name: /Generate Plan/i }).click();
    await expect(page.getByText('Critical Security Step')).toBeVisible();

    await page.getByLabel(/I confirm that I have written down/i).check();
    await page.getByRole('button', { name: /Continue to Split Shares/i }).click();

    await expect(page.getByText('Plan Secured')).toBeVisible();
    await expect(page.getByText('Social Recovery Shares')).toBeVisible();
  });
});

test.describe('Wizard - Timelock Step', () => {
  test.beforeEach(async ({ page }) => {
    await continueWithSampleKeys(page);
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
    await continueToReview(page);
  });

  test('should display review information', async ({ page }) => {
    await expect(page.getByText('Final Review')).toBeVisible();
    await expect(page.getByText('Network').first()).toBeVisible();
    await expect(page.getByText('Delay').first()).toBeVisible();
  });

  test('should generate plan successfully', async ({ page }) => {
    await page.getByRole('button', { name: /Generate Plan/i }).click();
    await expect(page.getByText('Plan Secured')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Vault Address \(testnet\)/i })).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should navigate to Learn page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Learn How It Works/i }).click();
    await expect(page.getByText('Understanding Bitcoin Will')).toBeVisible();
  });

  test('should navigate back from wizard', async ({ page }) => {
    await startWizard(page);
    await page.getByRole('button', { name: /Cancel/i }).click();
    await expect(page.getByRole('link', { name: /Create Spending Plan/i })).toBeVisible();
  });
});
