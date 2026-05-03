import { test, expect, type Page } from '@playwright/test';

const MAINNET_CONFIRMATION_PHRASE = 'I UNDERSTAND MAINNET IS REAL MONEY';

const startWizard = async (page: Page) => {
  await page.goto('/create');
  await expect(page.getByText('Choose your inheritance strategy')).toBeVisible();
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
    const primaryNav = page.getByRole('navigation', { name: 'Primary' });
    const referenceNav = page.getByRole('navigation', { name: 'Reference' });

    await expect(primaryNav.getByRole('button', { name: 'Home' })).toBeVisible();
    await expect(primaryNav.getByRole('button', { name: 'Create plan' })).toBeVisible();
    await expect(primaryNav.getByRole('button', { name: 'Recover' })).toBeVisible();
    await expect(referenceNav.getByRole('button', { name: 'Learn' })).toBeVisible();
  });

  test('should navigate to create wizard when clicking Create link', async ({ page }) => {
    await page.getByRole('main').getByRole('button', { name: /Create plan/i }).click();
    await expect(page.getByText('Choose your inheritance strategy')).toBeVisible();
    await expect(page.getByText('Step 1 of 4')).toBeVisible();
  });

  test('should display feature cards', async ({ page }) => {
    await expect(page.getByText('Not a wallet')).toBeVisible();
    await expect(page.getByText('Not a legal will')).toBeVisible();
    await expect(page.getByText('Not a custodian')).toBeVisible();
  });

  test('should switch to mainnet after confirmation phrase', async ({ page }) => {
    await page.getByLabel('Select Bitcoin network').selectOption('mainnet');
    await expect(page.getByRole('dialog', { name: 'Switch to mainnet?' })).toBeVisible();

    await page.getByLabel('Type the confirmation phrase').fill(MAINNET_CONFIRMATION_PHRASE);
    await page.getByRole('button', { name: 'Switch to mainnet' }).click();

    await expect(page.getByLabel('Select Bitcoin network')).toHaveValue('mainnet');
    await expect(page.getByText('Live')).toBeVisible();
  });
});

test.describe('Wizard - Type Step', () => {
  test.beforeEach(async ({ page }) => {
    await startWizard(page);
  });

  test('should display type selection step', async ({ page }) => {
    await expect(page.getByText('Choose your inheritance strategy')).toBeVisible();
    await expect(page.getByText('Timelock recovery')).toBeVisible();
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
    await expect(page.getByText('Add public keys')).toBeVisible();
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
    await expect(page.getByText('Set the delay')).toBeVisible();
  });
});

test.describe('Wizard - Social Recovery', () => {
  test('should generate a social recovery plan with an app-generated beneficiary key', async ({ page }) => {
    await startWizard(page);
    await page.getByRole('switch', { name: /Toggle social recovery/i }).click();
    await page.getByRole('button', { name: /2-of-3 Shares/i }).click();
    await page.getByRole('button', { name: /Continue/i }).click();

    await expect(page.getByText('Add owner public key')).toBeVisible();
    await expect(page.getByLabel(/Owner Public Key/i)).toBeVisible();
    await expect(page.getByLabel(/Beneficiary Public Key/i)).toBeHidden();

    await page.getByRole('button', { name: /Use Sample/i }).click();
    await page.getByRole('button', { name: /Continue/i }).click();
    await expect(page.getByText('Set the delay')).toBeVisible();

    await page.getByRole('button', { name: /Continue/i }).click();
    await expect(page.getByText('Review and generate')).toBeVisible();

    await page.getByRole('button', { name: /Generate Plan/i }).click();
    await expect(page.getByText('Save the beneficiary private key first')).toBeVisible();

    await page.getByLabel(/I confirm I have stored this private key/i).check();
    await page.getByRole('button', { name: /Continue to Split Shares/i }).click();

    await expect(page.getByText(/Plan generated/i)).toBeVisible();
    await expect(page.getByText(/Social recovery shares/i)).toBeVisible();

    await page.getByRole('button', { name: /View instructions/i }).click();
    await expect(page.getByRole('heading', { name: /Beneficiary instructions/i })).toBeVisible();
  });
});

test.describe('Wizard - Timelock Step', () => {
  test.beforeEach(async ({ page }) => {
    await continueWithSampleKeys(page);
  });

  test('should display timelock slider', async ({ page }) => {
    await expect(page.getByText('Set the delay')).toBeVisible();
    await expect(page.getByLabel(/Timelock blocks/i)).toBeVisible();
  });

  test('should proceed to review step', async ({ page }) => {
    await page.getByRole('button', { name: /Continue/i }).click();
    await expect(page.getByText('Review and generate')).toBeVisible();
    await expect(page.getByText('Step 4 of 4')).toBeVisible();
  });
});

test.describe('Wizard - Review & Generate', () => {
  test.beforeEach(async ({ page }) => {
    await continueToReview(page);
  });

  test('should display review information', async ({ page }) => {
    await expect(page.getByText('Review and generate')).toBeVisible();
    await expect(page.getByText('Network').first()).toBeVisible();
    await expect(page.getByText('Inactivity period').first()).toBeVisible();
  });

  test('should generate plan successfully', async ({ page }) => {
    await page.getByRole('button', { name: /Generate Plan/i }).click();
    await expect(page.getByText(/Plan generated/i)).toBeVisible();
    await expect(page.getByText('Vault address').first()).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should navigate to Learn page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Reference' }).getByRole('button', { name: 'Learn' }).click();
    await expect(page.getByText('Understanding Bitcoin Will')).toBeVisible();
  });

  test('should navigate back from wizard', async ({ page }) => {
    await startWizard(page);
    await page.getByRole('button', { name: /Cancel/i }).first().click();
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
  });
});
