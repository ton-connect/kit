/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { step } from 'allure-js-commons';

import { TEST_PASSWORD } from '../constants';
import { SetupWalletPage } from '../pages';

/**
 * Create a fresh mainnet wallet and land on the dashboard. The caller MUST install the
 * API mocks (`mockWalletApi`) BEFORE this runs, so the route handlers are in place before
 * WalletKit fires its first balance/jettons/rates/traces fetch (which happens as soon as
 * the wallet address is set). Mainnet is selected by default; the explorer host and the
 * default-token (USDT/XAUT) padding are mainnet-only.
 */
export async function createWalletOnDashboard(page: Page): Promise<void> {
    await step('Onboard a fresh wallet to the dashboard', async () => {
        const setupWallet = new SetupWalletPage(page);

        await page.getByTestId('welcome-create').click();
        await page.getByTestId('password').fill(TEST_PASSWORD);
        await page.getByTestId('password-confirm').fill(TEST_PASSWORD);
        await page.getByTestId('password-submit').click();
        await page.getByTestId('reveal-mnemonic').waitFor({ state: 'visible' });

        await page.getByTestId('reveal-mnemonic').click();
        await setupWallet.confirmAndCreate();

        await expect(page.getByTestId('wallet-menu')).toBeVisible();
    });
}
