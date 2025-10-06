import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    timeout: 120_000,
    expect: {
        timeout: 20_000,
    },
    reporter: process.env.CI ? [['list'], ['allure-playwright']] : [['list'], ['html'], ['allure-playwright']],
    use: {
        screenshot: 'on',
        trace: 'on',
        permissions: ['clipboard-read', 'clipboard-write'],
    },
    projects: process.env.E2E_WALLET_SOURCE_EXTENSION
        ? [
              // extension mode
              {
                  name: 'chromium',
                  use: {
                      ...devices['Desktop Chrome'],
                  },
              },
          ]
        : [
              // web mode
              {
                  name: 'chromium',
                  use: {
                      ...devices['Desktop Chrome'],
                  },
              },
              // FIXME on firefox error: browser.newContext: Unknown permission: clipboard-read
              // {
              //     name: 'firefox',
              //     use: {
              //         ...devices['Desktop Firefox'],
              //     },
              // },
              // FIXME on webkit
              // {
              //     name: 'safari',
              //     use: {
              //         ...devices['Desktop Safari'],
              //     },
              // },
          ],
    webServer: process.env.E2E_WALLET_SOURCE_EXTENSION
        ? undefined
        : {
              command: 'pnpm --filter demo-wallet dev',
              url: 'http://localhost:5173/',
              reuseExistingServer: true,
          },
});
