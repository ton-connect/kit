/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { test as base, expect } from '../qa/test-base';
import { testWithGaslessFixture, connectWallet } from '../fixtures/gaslessFixture';
import { MinterPage } from '../pages/MinterPage';
import { gaslessMeta } from '../qa/allure-meta';
import { USDT_MASTER } from '../mocks/gaslessRelayer';

/**
 * Gasless availability.
 *
 * NB: the appkit-minter transfer modal is reached via the Assets list, which is
 * EMPTY until a wallet is connected. So the "gasless block visible/hidden" checks
 * are wallet-gated and live under the two-tab fixture; only the empty-state check
 * is genuinely wallet-less.
 */

// --- wallet-less: Assets empty state renders without crashing ---
base.describe('Availability (no wallet)', () => {
    base('Assets list shows empty state without a connected wallet (no crash) @allure.id=9849', async ({ page }) => {
        await gaslessMeta('Availability');
        const pageErrors: string[] = [];
        await base.step('Open the jettons list without a connected wallet', async () => {
            page.on('pageerror', (e) => pageErrors.push(e.message));
            const minter = new MinterPage(page);
            await page.goto('/');
            await minter.gotoJettons();
        });
        await base.step('Page does not crash — Connect Wallet button is visible, no errors', async () => {
            // No transfer modal is reachable without a wallet — the page must simply not crash.
            await expect(page.getByRole('button', { name: /Connect Wallet/i }).first()).toBeVisible();
            expect(pageErrors, `unexpected page errors: ${pageErrors.join('; ')}`).toEqual([]);
        });
    });
});

// --- wallet-based: gasless block visibility per asset / wallet feature ---
const test = testWithGaslessFixture({
    appUrl: process.env.MINTER_URL ?? 'http://localhost:5174/',
});

test.describe('Availability (two-tab wallet)', () => {
    test('No Gasless block in the GRAM transfer modal @allure.id=9983', async ({ minter, widget, wallet }) => {
        await gaslessMeta('Availability');
        await test.step('Connect wallet and open GRAM transfer', async () => {
            await connectWallet({ widget, wallet });
            await minter.openTransfer('ton');
        });
        await test.step('Gasless block is absent', async () => {
            await expect(minter.gaslessLabel).toHaveCount(0);
        });
    });

    test('Jetton transfer — Gasless checkbox enabled for a SignMessage wallet @allure.id=9869', async ({ minter, widget, wallet }) => {
        await gaslessMeta('Availability');
        await test.step('Connect wallet and open USDT transfer', async () => {
            await connectWallet({ widget, wallet });
            await minter.openTransfer(USDT_MASTER);
        });
        await test.step('Gasless block is visible, checkbox enabled, no missing-SignMessage hint', async () => {
            await expect(minter.gaslessLabel).toBeVisible();
            await expect(minter.gaslessCheckbox).toBeEnabled();
            await expect(minter.noSignMessageHint).toHaveCount(0);
        });
    });
});
