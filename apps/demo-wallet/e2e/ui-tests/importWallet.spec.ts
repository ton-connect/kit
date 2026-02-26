/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect } from '@playwright/test';
import type { NetworkType } from '@demo/wallet-core';

import { testWithUIFixture } from './UITestFixture';

const test = testWithUIFixture();

const PASSWORD = 'tester@1234';

// Test mnemonic - this should be a valid test mnemonic for e2e tests
const TEST_MNEMONIC = process.env.WALLET_MNEMONIC ?? '';

type WalletVersion = 'v4r2' | 'v5r1';
type InterfaceType = 'mnemonic' | 'signer';

interface ImportWalletTestCase {
    network: NetworkType;
    version: WalletVersion;
    interfaceType: InterfaceType;
}

const testMatrix: ImportWalletTestCase[] = [
    // Mainnet combinations
    { network: 'mainnet', version: 'v4r2', interfaceType: 'mnemonic' },
    { network: 'mainnet', version: 'v4r2', interfaceType: 'signer' },
    { network: 'mainnet', version: 'v5r1', interfaceType: 'mnemonic' },
    { network: 'mainnet', version: 'v5r1', interfaceType: 'signer' },
    // Testnet combinations
    { network: 'testnet', version: 'v4r2', interfaceType: 'mnemonic' },
    { network: 'testnet', version: 'v4r2', interfaceType: 'signer' },
    { network: 'testnet', version: 'v5r1', interfaceType: 'mnemonic' },
    { network: 'testnet', version: 'v5r1', interfaceType: 'signer' },
];

test.describe('Import Wallet Flow', () => {
    test.beforeEach(async ({ page }) => {
        if (!TEST_MNEMONIC) {
            test.skip(true, 'WALLET_MNEMONIC environment variable is required');
        }

        // Setup password first
        await page.getByTestId('title').filter({ hasText: 'Setup Password' }).waitFor({ state: 'visible' });
        await page.getByTestId('subtitle').filter({ hasText: 'Create Password' }).waitFor({ state: 'visible' });
        await page.getByTestId('password').fill(PASSWORD);
        await page.getByTestId('password-confirm').fill(PASSWORD);
        await page.getByTestId('password-submit').click();

        // Wait for setup wallet page - Layout title is "Setup Wallet"
        await page.getByTestId('title').filter({ hasText: 'Setup Wallet' }).waitFor({ state: 'visible' });

        // Click on "Import" tab
        await page.getByTestId('tab-import').click();
        await page.getByTestId('subtitle').filter({ hasText: 'Import Wallet' }).waitFor({ state: 'visible' });
    });

    for (const testCase of testMatrix) {
        const testName = `Import wallet - ${testCase.network} / ${testCase.version} / ${testCase.interfaceType}`;

        test(testName, async ({ page }) => {
            // Select network
            await page.getByTestId(`network-select-${testCase.network}`).click();

            // Verify network button is enabled
            await expect(page.getByTestId(`network-select-${testCase.network}`)).toBeEnabled();

            // Select wallet version
            await page.getByTestId(`version-select-${testCase.version}`).click();

            // Verify version button is enabled
            await expect(page.getByTestId(`version-select-${testCase.version}`)).toBeEnabled();

            // Select interface type
            await page.getByTestId(`interface-select-${testCase.interfaceType}`).click();

            // Verify interface button is enabled
            await expect(page.getByTestId(`interface-select-${testCase.interfaceType}`)).toBeEnabled();

            // Paste mnemonic using the Paste button
            await page.evaluate(async (mnemonic) => {
                await navigator.clipboard.writeText(mnemonic);
            }, TEST_MNEMONIC);

            // Click the Paste button
            await page.getByTestId('paste-mnemonic').click();

            // Wait for words to be filled
            await page.waitForTimeout(500);

            // Click Import Wallet button
            await page.getByTestId('import-wallet-process').click();

            // Verify navigation to wallet dashboard
            await page.getByTestId('title').filter({ hasText: 'TON Wallet' }).waitFor({ state: 'visible' });
        });
    }
});

test.describe('Import Wallet - Validation', () => {
    test.beforeEach(async ({ page }) => {
        // Setup password first
        await page.getByTestId('title').filter({ hasText: 'Setup Password' }).waitFor({ state: 'visible' });
        await page.getByTestId('subtitle').filter({ hasText: 'Create Password' }).waitFor({ state: 'visible' });
        await page.getByTestId('password').fill(PASSWORD);
        await page.getByTestId('password-confirm').fill(PASSWORD);
        await page.getByTestId('password-submit').click();

        // Wait for setup wallet page - Layout title is "Setup Wallet"
        await page.getByTestId('title').filter({ hasText: 'Setup Wallet' }).waitFor({ state: 'visible' });

        // Click on "Import" tab
        await page.getByTestId('tab-import').click();
        await page.getByTestId('subtitle').filter({ hasText: 'Import Wallet' }).waitFor({ state: 'visible' });
    });

    test('Import button is disabled with no mnemonic', async ({ page }) => {
        // The Import Wallet button should be disabled without mnemonic
        await expect(page.getByTestId('import-wallet-process')).toBeDisabled();
    });

    test('Import button is disabled with less than 12 words', async ({ page }) => {
        // Fill only 10 words
        const testWords = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10';
        await page.evaluate(async (mnemonic) => {
            await navigator.clipboard.writeText(mnemonic);
        }, testWords);

        await page.getByTestId('paste-mnemonic').click();
        await page.waitForTimeout(300);

        // The Import Wallet button should be disabled
        await expect(page.getByTestId('import-wallet-process')).toBeDisabled();
    });

    test('Clear button clears all words', async ({ page }) => {
        if (!TEST_MNEMONIC) {
            test.skip(true, 'WALLET_MNEMONIC environment variable is required');
        }

        // Paste mnemonic
        await page.evaluate(async (mnemonic) => {
            await navigator.clipboard.writeText(mnemonic);
        }, TEST_MNEMONIC);

        await page.getByTestId('paste-mnemonic').click();
        await page.waitForTimeout(300);

        // Click Clear button
        await page.getByTestId('clear-mnemonic').click();

        // Verify all inputs are empty (word count should be 0)
        await expect(page.getByTestId('word-count')).toHaveText('0/24 words');

        // Import button should be disabled
        await expect(page.getByTestId('import-wallet-process')).toBeDisabled();
    });
});
