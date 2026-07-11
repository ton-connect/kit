/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { NetworkType } from '@demo/wallet-core';
import { step } from 'allure-js-commons';

import { testWithUIFixture } from './UITestFixture';
import { TEST_PASSWORD } from '../constants';

const test = testWithUIFixture();

// Test mnemonic - this should be a valid test mnemonic for e2e tests
const TEST_MNEMONIC = process.env.WALLET_MNEMONIC ?? '';

type WalletVersion = 'v4r2' | 'v5r1';
type InterfaceType = 'mnemonic' | 'signer';

interface ImportWalletTestCase {
    network: NetworkType;
    version: WalletVersion;
    interfaceType: InterfaceType;
    /** Pinned TestOps case id, emitted into the generated title as the @allure.id token. */
    allureId: string;
}

const testMatrix: ImportWalletTestCase[] = [
    // Mainnet combinations
    { network: 'mainnet', version: 'v4r2', interfaceType: 'mnemonic', allureId: '8955' },
    { network: 'mainnet', version: 'v4r2', interfaceType: 'signer', allureId: '8937' },
    { network: 'mainnet', version: 'v5r1', interfaceType: 'mnemonic', allureId: '8848' },
    { network: 'mainnet', version: 'v5r1', interfaceType: 'signer', allureId: '8941' },
    // Testnet combinations
    { network: 'testnet', version: 'v4r2', interfaceType: 'mnemonic', allureId: '8943' },
    { network: 'testnet', version: 'v4r2', interfaceType: 'signer', allureId: '8811' },
    { network: 'testnet', version: 'v5r1', interfaceType: 'mnemonic', allureId: '8792' },
    { network: 'testnet', version: 'v5r1', interfaceType: 'signer', allureId: '8951' },
];

/** Welcome → "Add an existing wallet" → "Recovery phrase" → set a password → land on the import screen. */
async function openImportScreen(page: Page): Promise<void> {
    await step('Open the import screen', async () => {
        await page.getByTestId('welcome-add-existing').click();
        await page.getByTestId('add-wallet-import').click();
        await page.getByTestId('password').fill(TEST_PASSWORD);
        await page.getByTestId('password-confirm').fill(TEST_PASSWORD);
        await page.getByTestId('password-submit').click();
        await page.getByTestId('paste-mnemonic').waitFor({ state: 'visible' });
    });
}

test.describe('Import Wallet Flow', () => {
    test.beforeEach(async ({ page }) => {
        if (!TEST_MNEMONIC) {
            test.skip(true, 'WALLET_MNEMONIC environment variable is required');
        }
        await openImportScreen(page);
    });

    for (const testCase of testMatrix) {
        const testName = `@allure.id=${testCase.allureId} Import wallet - ${testCase.network} / ${testCase.version} / ${testCase.interfaceType}`;

        test(testName, async ({ page }) => {
            await step(
                `Select network/version/interface (${testCase.network} / ${testCase.version} / ${testCase.interfaceType})`,
                async () => {
                    await page.getByTestId(`network-select-${testCase.network}`).click();
                    await expect(page.getByTestId(`network-select-${testCase.network}`)).toBeEnabled();

                    await page.getByTestId(`version-select-${testCase.version}`).click();
                    await expect(page.getByTestId(`version-select-${testCase.version}`)).toBeEnabled();

                    await page.getByTestId(`interface-select-${testCase.interfaceType}`).click();
                    await expect(page.getByTestId(`interface-select-${testCase.interfaceType}`)).toBeEnabled();
                },
            );

            await step('Paste recovery phrase & import', async () => {
                // Paste the recovery phrase via the Paste button (reads the clipboard).
                await page.evaluate(async (mnemonic) => {
                    await navigator.clipboard.writeText(mnemonic);
                }, TEST_MNEMONIC);
                await page.getByTestId('paste-mnemonic').click();

                await page.getByTestId('import-wallet-process').click();

                // The settings button only exists on the wallet dashboard.
                await expect(page.getByTestId('wallet-menu')).toBeVisible();
            });
        });
    }
});

test.describe('Import Wallet - Validation', () => {
    test.beforeEach(async ({ page }) => {
        await openImportScreen(page);
    });

    test('@allure.id=8952 Import button is disabled with no mnemonic', async ({ page }) => {
        await step('Verify the import button is disabled', async () => {
            await expect(page.getByTestId('import-wallet-process')).toBeDisabled();
        });
    });

    test('@allure.id=8945 Import button is disabled with less than 12 words', async ({ page }) => {
        await step('Paste a recovery phrase with too few words', async () => {
            const testWords = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10';
            await page.evaluate(async (mnemonic) => {
                await navigator.clipboard.writeText(mnemonic);
            }, testWords);

            await page.getByTestId('paste-mnemonic').click();
        });

        await step('Verify the import button is disabled', async () => {
            await expect(page.getByTestId('import-wallet-process')).toBeDisabled();
        });
    });

    test('@allure.id=8913 Clear button clears all words', async ({ page }) => {
        if (!TEST_MNEMONIC) {
            test.skip(true, 'WALLET_MNEMONIC environment variable is required');
        }

        await step('Paste the recovery phrase', async () => {
            await page.evaluate(async (mnemonic) => {
                await navigator.clipboard.writeText(mnemonic);
            }, TEST_MNEMONIC);
            await page.getByTestId('paste-mnemonic').click();
        });

        await step('Clear the words', async () => {
            await page.getByTestId('clear-mnemonic').click();
        });

        await step('Verify the word count resets and the import button is disabled', async () => {
            await expect(page.getByTestId('word-count')).toHaveText('0/24 words');
            await expect(page.getByTestId('import-wallet-process')).toBeDisabled();
        });
    });
});
