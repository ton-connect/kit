/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect } from '@playwright/test';

import { testWithUIFixture } from './UITestFixture';
import { createWalletOnDashboard } from './helpers';
import { AssetsPage } from '../pages';
import { mockWalletApi, USDT_MASTER_RAW } from '../mocks/walletApi';

const test = testWithUIFixture();

/**
 * Amount formatting through the Assets list, where the native GRAM row and jetton rows
 * render `formatLargeValue(amount, 4)`. `formatLargeValue` abbreviates ≥1M to M/B/T using the
 * integer-digit count, ALWAYS prints 2 fractional digits in that branch (the `decimals` arg is
 * ignored — silent precision drop ≥1M) and floors rather than rounds.
 */
test.describe('Amount formatting on the Assets list', () => {
    test('@allure.id=10209 Abbreviates a ≥1M GRAM balance to "M" with 2 digits, floored', async ({
        webOnly: _webOnly,
        page,
    }) => {
        // 1,234,567.899... GRAM (raw nanotons) → "1.23M" (floor to .23, never .24; only 2 digits even
        // though the row asks for 4). This is the precision-drop + floor behaviour in one assertion.
        await mockWalletApi(page, { balanceNano: '1234567899000000' });
        await createWalletOnDashboard(page);

        const assets = new AssetsPage(page);
        await page.getByRole('button', { name: 'View all assets' }).click();
        await assets.waitForPage();

        await expect(assets.gramName).toBeVisible();
        await expect(page.getByText('1.23M GRAM', { exact: false }).first()).toBeVisible();
    });

    test('@allure.id=10208 Accepts a 0-decimals jetton (not rejected) and lists it', async ({
        webOnly: _webOnly,
        page,
    }) => {
        // A jetton advertising decimals=0 is rendered on the assets list (the b45c9401 fix changed the
        // gate from `!decimals` to `== null`, so 0-decimals is valid).
        await mockWalletApi(page, {
            jettons: [{ masterRaw: USDT_MASTER_RAW, balance: '500', symbol: 'PTS', name: 'Points Token', decimals: 0 }],
        });
        await createWalletOnDashboard(page);

        const assets = new AssetsPage(page);
        await page.getByRole('button', { name: 'View all assets' }).click();
        await assets.waitForPage();

        await expect(assets.nameCell('Points Token')).toBeVisible();
        // 500 base units at 0 decimals = 500 whole tokens.
        await expect(page.getByText('500 PTS', { exact: false }).first()).toBeVisible();
    });
});
