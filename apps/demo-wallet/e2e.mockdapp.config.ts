/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';
import { fileURLToPath } from 'url';

import { config } from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Fully mock-first two-tab TON Connect config: pairs the SELF-CONTAINED QA Mock dApp
// (tab 1, :5175 — `e2e/mock-dapp/`, raw @tonconnect/sdk) with the redesigned demo-wallet
// (tab 2, :5173). The dApp drives connect / sendTransaction / signData / signMessage over
// the real TON Connect bridge; the wallet runs with on-chain broadcast suppressed
// (VITE_DISABLE_NETWORK_SEND) and the manifest domain check disabled
// (VITE_DISABLE_MANIFEST_DOMAIN_CHECK). Self-contained: it starts both tabs' servers itself.
config({ quiet: true });

const workersCount = process.env.WORKERS_COUNT ? parseInt(process.env.WORKERS_COUNT) : undefined;
const timeout = process.env.TIMEOUT ? parseInt(process.env.TIMEOUT) : 60_000;
const headless =
    process.env.ENABLE_HEADLESS === 'true' ? true : process.env.ENABLE_HEADLESS === 'false' ? false : undefined;

// `127.0.0.1` (NOT `localhost`): WalletKit's manifest `isValidHost` guard rejects dot-less
// hosts before fetching, regardless of `disableManifestDomainCheck` — see the mock-dApp's
// main.ts / packages/walletkit/src/utils/url.ts. `127.0.0.1` has dots and passes.
const APP_URL = process.env.MOCK_DAPP_URL ?? 'http://127.0.0.1:5175/';
// Guard against a dot-less host: WalletKit's manifest `isValidHost` rejects `localhost`
// (no dot) before fetching the manifest, regardless of `disableManifestDomainCheck`, so the
// connect handshake would fail with a confusing "App manifest not found". Use a dotted host
// (e.g. 127.0.0.1). See e2e/mock-dapp/main.ts / packages/walletkit/src/utils/url.ts.
if (new URL(APP_URL).hostname === 'localhost') {
    throw new Error(
        `MOCK_DAPP_URL must use a dotted host (e.g. http://127.0.0.1:5175/), not 'localhost': ` +
            `WalletKit's manifest isValidHost guard rejects dot-less hosts. Got: ${APP_URL}`,
    );
}
const WALLET_SOURCE = process.env.E2E_WALLET_SOURCE ?? 'http://localhost:5173/';

// Absolute path to the mock-dApp vite config — robust to the cwd vite is launched from.
const MOCK_DAPP_VITE_CONFIG = path.resolve(__dirname, 'e2e/mock-dapp/vite.config.ts');

// Start the mock-dApp (tab 1) unless an external MOCK_DAPP_URL is supplied.
const mockDappServer = process.env.MOCK_DAPP_URL
    ? []
    : [
          {
              command: `pnpm --filter demo-wallet exec vite --config ${MOCK_DAPP_VITE_CONFIG}`,
              url: 'http://127.0.0.1:5175/',
              reuseExistingServer: !process.env.CI,
              timeout: 120_000,
          },
      ];

// Start the demo-wallet (tab 2) unless it is served elsewhere. Network send + manifest
// domain check are disabled so the wallet signs/responds over the bridge without broadcasting
// and accepts the localhost mock-dApp manifest.
const walletServer = WALLET_SOURCE.includes('localhost:5173')
    ? [
          {
              command:
                  'VITE_DISABLE_NETWORK_SEND=true VITE_DISABLE_MANIFEST_DOMAIN_CHECK=true pnpm --filter demo-wallet dev',
              url: 'http://localhost:5173/',
              reuseExistingServer: !process.env.CI,
              timeout: 120_000,
          },
      ]
    : [];

export default defineConfig({
    testDir: './e2e/mock-dapp-tests',
    timeout,
    expect: { timeout },
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    // The handshake + requests ride the real TON Connect bridge; CI retries absorb transient
    // bridge/timing hiccups (same retry policy as the appkit-minter gasless two-tab gate).
    retries: process.env.CI ? 2 : 0,
    workers: workersCount ?? 1,
    reporter: [['list'], ['allure-playwright', { detail: false }]],
    use: {
        baseURL: APP_URL,
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
            ],
        },
        headless,
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: [...mockDappServer, ...walletServer],
});
