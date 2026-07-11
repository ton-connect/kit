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

test.describe('Staking page form (mocked wallet API, no network send)', () => {
    test.beforeEach(async ({ webOnly: _webOnly, page }) => {
        await mockWalletApi(page);
    });

    test('@allure.id=10095 Shows stake/unstake tabs and Available / Staked balances', async ({ page }) => {
        await createWalletOnDashboard(page);
        await page.getByTestId('stake-button').click();
        await expect(page.getByRole('heading', { name: 'Stake' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'stake', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'unstake', exact: true })).toBeVisible();
        await expect(page.getByText('Available', { exact: true })).toBeVisible();
        await expect(page.getByText('Staked', { exact: true })).toBeVisible();
        // The pool summary defaults to the Tonstakers provider.
        await expect(page.getByText('Tonstakers', { exact: true })).toBeVisible();
    });

    test('@allure.id=10115 Max fills the stake amount keeping the gas reserve', async ({ page }) => {
        await createWalletOnDashboard(page);
        await page.getByTestId('stake-button').click();
        await expect(page.getByRole('heading', { name: 'Stake' })).toBeVisible();
        // On the stake tab, Max writes (available balance − STAKE_GAS_RESERVE). With the mocked
        // 12.5 GRAM balance and the component's 1.2 GRAM reserve (staking-interface.tsx
        // STAKE_GAS_RESERVE), handleMax sets `String(12.5 - 1.2)` = "11.3" exactly — assert that
        // reserve-adjusted value, not merely that something non-empty was written.
        await page.getByRole('button', { name: 'Max', exact: true }).click();
        await expect(page.getByTestId('stake-amount-input')).toHaveValue('11.3');
    });

    test('@allure.id=10108 Guards a stake that would not keep the gas reserve', async ({ page }) => {
        await createWalletOnDashboard(page);
        await page.getByTestId('stake-button').click();
        await expect(page.getByRole('heading', { name: 'Stake' })).toBeVisible();
        // 12.0 GRAM is below the balance (12.5) but above the keep-reserve threshold (12.5 - 1.2 = 11.3),
        // so the reserve guard fires.
        await page.getByTestId('stake-amount-input').fill('12');
        await expect(page.getByText('Keep ~1.2 GRAM for network fees', { exact: true })).toBeVisible();
    });

    test('@allure.id=10098 Guards a stake above the available balance', async ({ page }) => {
        await createWalletOnDashboard(page);
        await page.getByTestId('stake-button').click();
        await expect(page.getByRole('heading', { name: 'Stake' })).toBeVisible();
        await page.getByTestId('stake-amount-input').fill('999999');
        await expect(page.getByText('Insufficient balance', { exact: true })).toBeVisible();
    });

    test('@allure.id=10116 Guards an unstake with nothing staked', async ({ page }) => {
        await createWalletOnDashboard(page);
        await page.getByTestId('stake-button').click();
        await expect(page.getByRole('heading', { name: 'Stake' })).toBeVisible();
        // With 0 staked, any unstake amount fails the "Not enough staked" guard.
        await page.getByRole('button', { name: 'unstake', exact: true }).click();
        await page.getByTestId('stake-amount-input').fill('1');
        await expect(page.getByText('Not enough staked', { exact: true })).toBeVisible();
    });
});
