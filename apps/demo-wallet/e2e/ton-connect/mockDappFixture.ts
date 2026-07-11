/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { config } from 'dotenv';
import type { BrowserContext, Page } from '@playwright/test';
import { test as base } from '@playwright/test';
import { feature, parentSuite, subSuite, suite, tags } from 'allure-js-commons';

import { launchPersistentContext } from '../qa';
import { DemoWallet } from '../demo-wallet';
import { mockWalletApi, mockEmulation, mockRunGetMethod } from '../mocks/walletApi';
import type { MockWalletApiOpts } from '../mocks/walletApi';
import { MockDapp } from './MockDapp';

config({ quiet: true });

/**
 * Fully mock-first two-tab TON Connect fixture for the redesigned demo-wallet.
 *
 * Self-contained mock-first variant: drives a mock-dApp we control
 * (`e2e/mock-dapp/`, :5175) instead of the appkit-minter. The mock-dApp drives all four request
 * kinds (connect / sendTransaction / signData / signMessage) over the real TON Connect
 * bridge and surfaces results into DOM testids — no modal scraping, no clipboard.
 *
 *  - `context`  — one persistent BrowserContext shared by both tabs.
 *  - `app`      — the mock-dApp Page (tab 1, :5175).
 *  - `dapp`     — the {@link MockDapp} driver over `app`.
 *  - `wallet`   — the {@link DemoWallet} driver (tab 2, :5173). Imports `WALLET_MNEMONIC`
 *                 and turns hold-to-sign OFF (via importWallet), so the per-type approve
 *                 testids are present.
 *
 * Balance mocking (transaction spec): the wallet's `onTransactionRequest` silently rejects
 * when balance < amount, so the transaction modal would never render for an unfunded seed.
 * A spec opts into a generous mocked balance by setting `cfg.mockWalletApi` — the mock is
 * installed at the **context** level (not page level) so it survives DemoWallet's open/close
 * page churn and is in place before WalletKit's first balance fetch. On-chain broadcast is
 * separately suppressed by `VITE_DISABLE_NETWORK_SEND=true` (set in the wallet dev server).
 */
export interface MockDappFixture {
    context: BrowserContext;
    app: Page;
    dapp: MockDapp;
    wallet: DemoWallet;
}

export interface MockDappConfig {
    appUrl?: string;
    walletSource?: string;
    mnemonic?: string;
    /** When set, installs the wallet-API mock on the context before the wallet tab opens. */
    mockWalletApi?: MockWalletApiOpts | boolean;
}

export function mockDappFixture(cfg: MockDappConfig = {}) {
    const appUrl = cfg.appUrl ?? process.env.MOCK_DAPP_URL ?? 'http://127.0.0.1:5175/';
    const walletSource = cfg.walletSource ?? process.env.E2E_WALLET_SOURCE ?? 'http://localhost:5173/';
    const mnemonic = cfg.mnemonic ?? process.env.WALLET_MNEMONIC ?? '';

    const extended = base.extend<MockDappFixture>({
        context: async ({ context: _ }, use) => {
            const context = await launchPersistentContext('');
            // Install the wallet-API mock at context level (applies to every page the
            // wallet opens later) BEFORE any wallet page navigates, so the dashboard
            // renders deterministically and the tx balance-guard sees the mocked balance.
            if (cfg.mockWalletApi) {
                const opts = typeof cfg.mockWalletApi === 'object' ? cfg.mockWalletApi : {};
                // BrowserContext.route shares Page.route's signature; the mock helpers only use .route.
                const ctxAsPage = context as unknown as Page;
                await mockWalletApi(ctxAsPage, opts);
                // The transaction-request preview emulates the transfer and signing fetches the
                // wallet seqno; both would otherwise storm/stall the real toncenter (emulate 500s,
                // seqno retries). Mock them so the modal settles and approval signs deterministically.
                await mockEmulation(ctxAsPage);
                await mockRunGetMethod(ctxAsPage);
            }
            await use(context);
            await context.close();
        },
        app: async ({ context }, use) => {
            const app = await context.newPage();
            await app.goto(appUrl, { waitUntil: 'load' });
            await use(app);
        },
        dapp: async ({ app }, use) => {
            await use(new MockDapp(app));
        },
        // Depends on `app` so the dApp tab is opened first; then import the wallet on its own tab.
        wallet: async ({ context, app: _app }, use) => {
            const wallet = new DemoWallet(context, walletSource);
            await wallet.importWallet(mnemonic);
            await use(wallet);
        },
    });

    // Authored suite tree (same scheme as UITestFixture): every two-tab test lands under
    // Demo Wallet ▸ TON Connect ▸ <describe>, overriding the adapter default parent-suite
    // (the Playwright project name), and is tagged automated. Case identity is pinned per
    // test via the @allure.id=<N> title token, so this hook carries no binding responsibility.
    // eslint-disable-next-line no-empty-pattern
    extended.beforeEach(async ({}, testInfo) => {
        await parentSuite('Demo Wallet');
        await suite('TON Connect');
        const fileIdx = testInfo.titlePath.findIndex((segment) => segment.endsWith('.spec.ts'));
        const describes = fileIdx >= 0 ? testInfo.titlePath.slice(fileIdx + 1, -1) : [];
        if (describes.length > 0) {
            await subSuite(describes.join(' > '));
            await feature(describes[0]);
        }
        await tags('automated');
    });

    return extended;
}
