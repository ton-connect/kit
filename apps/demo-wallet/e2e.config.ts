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
    // Specs that need their own Playwright config (extra webServer tabs) or an external backend
    // must NOT run under this default single-server config — otherwise they hang/fail and, with
    // `--retries=3`, blow the 30-min CI budget. After these exclusions the default run is the
    // mock-first `e2e/ui-tests/**` suite only.
    testIgnore: [
        // The mock-first two-tab TON Connect suite runs via its dedicated config, which starts
        // the extra dApp tab itself: e2e.mockdapp.config.ts (mock-dApp :5175). See e2e_web.yml
        // for the mock-dApp suite's CI step. (`e2e/ton-connect/` holds only the suite's driver
        // files — MockDapp.ts / mockDappFixture.ts — which aren't *.spec.ts, so nothing is
        // collected from there under this default config.)
        '**/mock-dapp-tests/**',
        // QUARANTINED (temporary): these drive the external allure-test-runner backend, which is
        // currently returning 500 on every case lookup → 3× retries × ~1 min each → CI timeout.
        // Re-enable once the runner backend is restored.
        '**/e2e/connect.spec.ts',
        '**/e2e/signData.spec.ts',
        '**/e2e/localSendTransaction.spec.ts',
        '**/e2e/sendTransaction/**',
    ],
    timeout: timeout,
    expect: {
        timeout: timeout,
    },
    fullyParallel: true,
    reporter: process.env.CI
        ? [['list'], ['html'], ['allure-playwright', { detail: false }]]
        : [['list'], ['html'], ['allure-playwright', { detail: false }]],
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
