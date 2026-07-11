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
import { mockWalletApi, USDT_MASTER_RAW, XAUT_MASTER_RAW } from '../mocks/walletApi';

const test = testWithUIFixture();

test.describe('Assets page (mocked wallet API)', () => {
    test('@allure.id=10113 Lists GRAM first, then jettons sorted by fiat desc', async ({ webOnly: _webOnly, page }) => {
        // USDT @ $1 × 42.5 ≈ $42.50; XAUT @ $2400 × 1.5 ≈ $3600 — so by fiat desc the order is
        // GRAM (native, always first) → XAUT → USDT. We assert all three render with their symbols.
        await mockWalletApi(page);
        await createWalletOnDashboard(page);

        const assets = new AssetsPage(page);
        await page.getByRole('button', { name: 'View all assets' }).click();
        await assets.waitForPage();

        await expect(assets.gramName).toBeVisible();
        await expect(assets.gramIcon).toBeVisible();
        await expect(assets.nameCell('Tether USD')).toBeVisible();
        await expect(assets.nameCell('Tether Gold')).toBeVisible();

        // Native GRAM row precedes both jettons; XAUT (higher fiat) precedes USDT.
        const gramY = await assets.gramName.boundingBox();
        const xautY = await assets.nameCell('Tether Gold').boundingBox();
        const usdtY = await assets.nameCell('Tether USD').boundingBox();
        expect(gramY && xautY && usdtY).toBeTruthy();
        expect(gramY!.y).toBeLessThan(xautY!.y);
        expect(xautY!.y).toBeLessThan(usdtY!.y);
    });

    test('@allure.id=10124 Renders the fallback two-letter icon when every image URL fails', async ({
        webOnly: _webOnly,
        page,
    }) => {
        // A jetton whose only icon candidate is an unreachable http URL (404/CSP under the offline
        // test env) and has no inline base64 → FallbackImage shows the gradient with the symbol's
        // first two letters ("BR" for "BRK"). No real image host is reachable in CI.
        await mockWalletApi(page, {
            jettons: [
                {
                    masterRaw: USDT_MASTER_RAW,
                    balance: '1000000',
                    symbol: 'BRK',
                    name: 'Broken Icon Token',
                    decimals: 6,
                    image: 'https://invalid.example.test/missing.png',
                },
            ],
        });
        await createWalletOnDashboard(page);

        const assets = new AssetsPage(page);
        await page.getByRole('button', { name: 'View all assets' }).click();
        await assets.waitForPage();

        await expect(assets.nameCell('Broken Icon Token')).toBeVisible();
        await expect(assets.fallbackText('BR')).toBeVisible();
    });

    test('@allure.id=10109 Shows the fiat value for an asset that has a rate', async ({ webOnly: _webOnly, page }) => {
        // The GRAM row has a rate ($5.20), so its right-hand fiat column shows a "$" amount.
        await mockWalletApi(page, {
            jettons: [{ masterRaw: XAUT_MASTER_RAW, balance: '0', symbol: 'XAUT', name: 'Tether Gold', decimals: 6 }],
        });
        await createWalletOnDashboard(page);

        const assets = new AssetsPage(page);
        await page.getByRole('button', { name: 'View all assets' }).click();
        await assets.waitForPage();

        await expect(assets.gramName).toBeVisible();
        // Scope the fiat assertion to the GRAM row itself (the asset under test), not page-wide —
        // a bare page `$` match would pass on any unrelated dollar amount. `gramFiat` is the
        // `asset-fiat` cell of the GRAM `asset-row` (asset-row.tsx); its `$<amount>` is the GRAM
        // holding's fiat value (≈$65 here).
        await expect(assets.gramFiat).toContainText('$');
    });
});
