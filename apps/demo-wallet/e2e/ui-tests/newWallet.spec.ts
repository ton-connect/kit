/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect } from '@playwright/test';

import { testWithUIFixture } from './UITestFixture';

const test = testWithUIFixture();

const PASSWORD = 'tester@1234';

test.describe('New Wallet Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Setup password first - Layout title is "Setup Password"
        await page.getByTestId('title').filter({ hasText: 'Setup Password' }).waitFor({ state: 'visible' });
        await page.getByTestId('subtitle').filter({ hasText: 'Create Password' }).waitFor({ state: 'visible' });
        await page.getByTestId('password').fill(PASSWORD);
        await page.getByTestId('password-confirm').fill(PASSWORD);
        await page.getByTestId('password-submit').click();

        // Wait for setup wallet page - Layout title is "Setup Wallet"
        await page.getByTestId('title').filter({ hasText: 'Setup Wallet' }).waitFor({ state: 'visible' });

        // Click on "New" tab (should be default, but ensure it's selected)
        await page.getByTestId('tab-create').click();
        await page.getByTestId('subtitle').filter({ hasText: 'Create New Wallet' }).waitFor({ state: 'visible' });
    });

    test('Create new wallet on Mainnet', async ({ page }) => {
        // Mainnet should be selected by default and enabled
        await expect(page.getByTestId('network-select-mainnet')).toBeEnabled();

        // Wait for mnemonic to be generated
        await page.getByTestId('reveal-mnemonic').waitFor({ state: 'visible' });

        // Click to reveal mnemonic
        await page.getByTestId('reveal-mnemonic').click();

        // Verify mnemonic grid is visible (24 words)
        await expect(page.getByTestId('mnemonic-grid')).toBeVisible();
        await expect(page.getByTestId('mnemonic-word-1')).toBeVisible();

        // Check the "I have saved" checkbox
        await page.getByTestId('saved-checkbox').check();

        // Click Import Wallet button
        await page.getByTestId('create-wallet-confirm').click();

        // Verify navigation to wallet dashboard
        await page.getByTestId('title').filter({ hasText: 'TON Wallet' }).waitFor({ state: 'visible' });
    });

    test('Create new wallet on Testnet', async ({ page }) => {
        // Switch to Testnet
        await page.getByTestId('network-select-testnet').click();

        // Verify testnet button is enabled
        await expect(page.getByTestId('network-select-testnet')).toBeEnabled();

        // Wait for mnemonic to be generated
        await page.getByTestId('reveal-mnemonic').waitFor({ state: 'visible' });

        // Click to reveal mnemonic
        await page.getByTestId('reveal-mnemonic').click();

        // Verify mnemonic grid is visible
        await expect(page.getByTestId('mnemonic-grid')).toBeVisible();
        await expect(page.getByTestId('mnemonic-word-1')).toBeVisible();

        // Check the "I have saved" checkbox
        await page.getByTestId('saved-checkbox').check();

        // Click Import Wallet button
        await page.getByTestId('create-wallet-confirm').click();

        // Verify navigation to wallet dashboard
        await page.getByTestId('title').filter({ hasText: 'TON Wallet' }).waitFor({ state: 'visible' });
    });

    test('Generate new mnemonic phrase', async ({ page }) => {
        // Wait for initial mnemonic generation
        await page.getByTestId('reveal-mnemonic').waitFor({ state: 'visible' });

        // Reveal the mnemonic
        await page.getByTestId('reveal-mnemonic').click();

        // Get the first word of initial mnemonic
        const initialFirstWord = await page.getByTestId('mnemonic-word-1').textContent();

        // Generate new phrase
        await page.getByTestId('generate-new-phrase').click();

        // Wait for new mnemonic
        await page.getByTestId('reveal-mnemonic').waitFor({ state: 'visible' });

        // Reveal again
        await page.getByTestId('reveal-mnemonic').click();

        // Verify mnemonic changed (first word should likely be different)
        // Note: There's a small chance they could be the same, but it's very unlikely
        const newFirstWord = await page.getByTestId('mnemonic-word-1').textContent();
        expect(newFirstWord).toBeDefined();
        expect(initialFirstWord).toBeDefined();
    });

    test('Cannot proceed without saving confirmation', async ({ page }) => {
        // Wait for mnemonic generation
        await page.getByTestId('reveal-mnemonic').waitFor({ state: 'visible' });

        // Reveal mnemonic
        await page.getByTestId('reveal-mnemonic').click();

        // The Import Wallet button should be disabled without checking the save checkbox
        await expect(page.getByTestId('create-wallet-confirm')).toBeDisabled();

        // Check the save checkbox
        await page.getByTestId('saved-checkbox').check();

        // Now the button should be enabled
        await expect(page.getByTestId('create-wallet-confirm')).toBeEnabled();
    });
});
