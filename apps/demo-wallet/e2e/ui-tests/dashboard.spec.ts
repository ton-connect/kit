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
import { mockWalletApi } from '../mocks/walletApi';

const test = testWithUIFixture();

test.describe('Dashboard smoke (mocked wallet API)', () => {
    test.beforeEach(async ({ webOnly: _webOnly, page }) => {
        // Routes MUST be installed before the dashboard loads its data.
        await mockWalletApi(page);
        await createWalletOnDashboard(page);
    });

    test('@allure.id=10107 Renders the fiat total once balance and rates load', async ({ page }) => {
        // BalanceTotal shows "$<int>.<frac>" only when balance !== undefined && ratesUpdated > 0.
        // With a 12.5 GRAM balance @ $5.20 plus jettons, the integer part is non-zero.
        //
        // Scope to the balance-total widget itself, not the whole page — a bare page `$` + integer
        // regex can match unrelated copy (asset rows, swap fields, etc.). The widget renders "$" +
        // integer + "." + fraction as separate spans; `balance-total` wraps them and
        // `balance-total-int` is the integer span (balance-total.tsx).
        const totalWidget = page.getByTestId('balance-total');
        await expect(totalWidget).toBeVisible();
        // Assert the `$` span and the INTEGER part (non-zero, >= 1 digit group — distinct from the
        // fraction span a bare digit regex would also match).
        await expect(totalWidget.getByText('$', { exact: true })).toBeVisible();
        await expect(page.getByTestId('balance-total-int')).toHaveText(/^\d{1,3}(,\d{3})*$/);
    });

    test('@allure.id=10123 Native row is labelled GRAM with the /gram.svg icon', async ({ page }) => {
        // The TON/GRAM asset row renders name "Gram" + symbol "GRAM" with icon /gram.svg.
        await expect(page.getByText('Gram', { exact: true }).first()).toBeVisible();
        await expect(page.locator('img[src="/gram.svg"]').first()).toBeVisible();
    });

    test('@allure.id=10097 Send / Swap / Stake actions are present', async ({ page }) => {
        await expect(page.getByTestId('send-button')).toBeVisible();
        await expect(page.getByTestId('swap-button')).toBeVisible();
        await expect(page.getByTestId('stake-button')).toBeVisible();
    });

    test('@allure.id=10125 Assets preview shows held jettons', async ({ page }) => {
        // The "Assets" section header and the mocked USDT holding both render.
        await expect(page.getByRole('heading', { name: 'Assets' })).toBeVisible();
        await expect(page.getByText('Tether USD', { exact: true }).first()).toBeVisible();
    });

    test('@allure.id=10106 Navigates to the Assets page', async ({ page }) => {
        await page.getByRole('button', { name: 'View all assets' }).click();
        await expect(page).toHaveURL(/\/wallet\/assets$/);
    });

    test('@allure.id=10117 Navigates to the NFT page', async ({ page }) => {
        // NftsCard only renders its header/link when the wallet holds NFTs (mocked: 2).
        await page.getByRole('button', { name: 'View all NFTs' }).click();
        await expect(page).toHaveURL(/\/wallet\/nft$/);
        // The full NFTs screen shows the same mocked items.
        await expect(page.getByText('Test NFT One', { exact: true }).first()).toBeVisible();
    });

    test('@allure.id=10094 Navigates to the History page', async ({ page }) => {
        // Now that the traces mock shapes real transfer rows, the dashboard History section renders
        // its "View all transactions" link (empty-section-hides otherwise); following it lands on
        // the full history page with the mocked rows.
        await page.getByRole('button', { name: 'View all transactions' }).click();
        await expect(page).toHaveURL(/\/wallet\/history$/);
        await expect(page.getByText('Sent 5 GRAM', { exact: true }).first()).toBeVisible();
    });
});
