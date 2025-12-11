/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { config } from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

// Загружаем переменные окружения из .env файла
config({ quiet: true });

const workersCount = process.env.WORKERS_COUNT ? parseInt(process.env.WORKERS_COUNT) : undefined;
const timeout = process.env.TIMEOUT ? parseInt(process.env.TIMEOUT) : 60_000;
const headless =
    process.env.ENABLE_HEADLESS === 'true' ? true : process.env.ENABLE_HEADLESS === 'false' ? false : undefined;

export default defineConfig({
    testDir: './e2e',
    timeout: timeout,
    expect: {
        timeout: timeout,
    },
    fullyParallel: true,
    reporter: process.env.CI
        ? [['list'], ['html'], ['allure-playwright']]
        : [['list'], ['html'], ['allure-playwright']],
    workers: workersCount,
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
        headless: headless,
    },
    projects:
        process.env.E2E_WALLET_SOURCE_EXTENSION &&
        process.env.E2E_WALLET_SOURCE_EXTENSION !== 'false' &&
        process.env.E2E_WALLET_SOURCE_EXTENSION !== '0'
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
    webServer:
        process.env.E2E_WALLET_SOURCE_EXTENSION &&
        process.env.E2E_WALLET_SOURCE_EXTENSION !== 'false' &&
        process.env.E2E_WALLET_SOURCE_EXTENSION !== '0'
            ? undefined
            : {
                  command: 'pnpm --filter demo-wallet dev',
                  url: 'http://localhost:5173/',
                  reuseExistingServer: true,
              },
});
