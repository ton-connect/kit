import { config } from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

// Загружаем переменные окружения из .env файла
config();

export default defineConfig({
    testDir: './e2e',
    timeout: 60_000,
    expect: {
        timeout: 60_000,
    },
    reporter: process.env.CI
        ? [['list'], ['html'], ['allure-playwright']]
        : [['list'], ['html'], ['allure-playwright']],
    workers: process.env.CI ? 2 : undefined,
    use: {
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
        permissions: ['clipboard-read', 'clipboard-write'],
        launchOptions: {
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--no-first-run',
                '--disable-infobars',
                '--disable-blink-features=AutomationControlled',
                '--use-fake-ui-for-media-stream',
                '--disable-permissions-api',
            ],
        },
        // headless: false,
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
