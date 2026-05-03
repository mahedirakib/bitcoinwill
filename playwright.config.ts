import { defineConfig, devices } from '@playwright/test';

const e2eHost = '127.0.0.1';
const e2ePort = Number.parseInt(process.env.E2E_PORT ?? '43174', 10);
const baseURL = `http://${e2eHost}:${e2ePort}`;
const reuseExistingServer =
  process.env.PLAYWRIGHT_REUSE_SERVER === undefined
    ? !process.env.CI
    : process.env.PLAYWRIGHT_REUSE_SERVER === '1';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --host ${e2eHost} --port ${e2ePort} --strictPort`,
    url: baseURL,
    reuseExistingServer,
  },
});
