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

import { testWithUIFixture } from './UITestFixture';
import { TEST_PASSWORD } from '../constants';
import { SetupWalletPage, UnlockWalletPage } from '../pages';

const test = testWithUIFixture();

/**
 * Create a fresh wallet (Welcome → Create → password → reveal → confirm), then
 * reload to drop the in-memory unlocked session. `isUnlocked` is not persisted
 * unless `persistPassword` is on (default off — see createWalletStore.ts `merge`),
 * so after reload `ProtectedRoute` redirects a saved-but-locked wallet to /unlock.
 */
async function createWalletThenLock(page: Page): Promise<void> {
    const setupWallet = new SetupWalletPage(page);

    await page.getByTestId('welcome-create').click();
    await page.getByTestId('password').fill(TEST_PASSWORD);
    await page.getByTestId('password-confirm').fill(TEST_PASSWORD);
    await page.getByTestId('password-submit').click();
    await page.getByTestId('reveal-mnemonic').waitFor({ state: 'visible' });

    await page.getByTestId('reveal-mnemonic').click();
    await setupWallet.confirmAndCreate();

    // Confirm we reached the dashboard before locking.
    await expect(page.getByTestId('wallet-menu')).toBeVisible();

    // Reload → locked session → ProtectedRoute sends us to /unlock.
    await page.reload({ waitUntil: 'load' });
}

test.describe('Unlock Wallet Flow', () => {
    test.beforeEach(async ({ webOnly: _webOnly, page }) => {
        await createWalletThenLock(page);
    });

    test('@allure.id=10121 Locked wallet shows the unlock screen after reload', async ({ page }) => {
        const unlock = new UnlockWalletPage(page);
        await step('Verify the unlock screen is shown', async () => {
            await unlock.waitForPage();
            await expect(page).toHaveURL(/\/unlock$/);
            await expect(page.getByTestId('subtitle')).toHaveText('Enter your password');
        });
    });

    test('@allure.id=10101 Wrong password shows "Incorrect password" and stays locked', async ({ page }) => {
        const unlock = new UnlockWalletPage(page);
        await unlock.waitForPage();

        await step('Submit a wrong password', async () => {
            await unlock.unlock('wrong-password');
        });

        await step('Verify an error is shown and the wallet stays locked', async () => {
            await expect(unlock.errorMessage).toBeVisible();
            // Still on the unlock screen — the dashboard is not reachable.
            await expect(page).toHaveURL(/\/unlock$/);
            await expect(page.getByTestId('wallet-menu')).toBeHidden();
        });
    });

    test('@allure.id=10128 Correct password unlocks and lands on the dashboard', async ({ page }) => {
        const unlock = new UnlockWalletPage(page);
        await unlock.waitForPage();

        await step('Unlock with the correct password', async () => {
            await unlock.unlock(TEST_PASSWORD);
        });

        await step('Verify the wallet dashboard is shown', async () => {
            // The settings button only exists on the wallet dashboard.
            await expect(page.getByTestId('wallet-menu')).toBeVisible();
            await expect(page).toHaveURL(/\/wallet$/);
        });
    });

    test('@allure.id=10110 Reset Wallet → confirm navigates to /welcome', async ({ page }) => {
        const unlock = new UnlockWalletPage(page);
        await unlock.waitForPage();

        await step('Reset the wallet from the unlock screen', async () => {
            await unlock.resetWallet();
        });

        await step('Verify we land back on the Welcome screen', async () => {
            await expect(page).toHaveURL(/\/welcome$/);
            await expect(page.getByTestId('welcome-create')).toBeVisible();
        });
    });
});
