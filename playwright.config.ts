import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['junit', { outputFile: 'reports/playwright-junit.xml' }],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  webServer: {
    command: 'npm run start:static',
    port: 8080,
    reuseExistingServer: !process.env.CI,
  },
  workers: 6, // Restrict Playwright to use only six workers in CI
  projects: [
    // JS-disabled projects (validate HTML-first behaviour)
    {
      name: 'chromium-js-off',
      use: {
        ...devices['Desktop Chrome'],
        javaScriptEnabled: false,
        headless: true,
      },
    },
    {
      name: 'webkit-js-off',
      use: {
        ...devices['Desktop Safari'],
        javaScriptEnabled: false,
        headless: true,
      },
    },

    // JS-enabled browsers (progressive enhancement checks)
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { executablePath: process.env.TEST_CHROME_PATH || undefined },
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
