/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect } from '@playwright/test';
import { label, suite, tags } from 'allure-js-commons';

import { testWithDemoWalletFixture } from './demo-wallet';

const test = testWithDemoWalletFixture({
    appUrl: process.env.DAPP_URL ?? 'https://allure-test-runner.vercel.app/e2e',
});

/**
 * E2E test for local TON send transaction (not via TonConnect)
 *
 * This tests the fix for handleNewTransaction passing walletId to TransactionHandler.
 * Previously, handleNewTransaction only passed walletAddress but not walletId,
 * causing TransactionHandler to fail with "Wallet not found" error.
 *
 * The fix adds walletId to the bridgeEvent in TonWalletKit.handleNewTransaction()
 */
test.describe('Local Send Transaction', () => {
    test('should trigger transaction request callback when sending TON locally', async ({ wallet }) => {
        await suite('Local Send Transaction');
        await label('sub-suite', 'handleNewTransaction fix');
        await tags('localSend', 'automated', 'regression');

        // Send TON locally to own address and reject (we just want to verify the modal appears)
        // If walletId is not passed correctly, this will fail with "Wallet not found"
        await wallet.sendTonToSelf('0.01', false);

        // If we get here without error, the fix works - walletId was passed correctly
        // and TransactionHandler found the wallet
        await wallet.close();
    });

    test('should approve local TON transaction successfully', async ({ wallet }) => {
        await suite('Local Send Transaction');
        await label('sub-suite', 'handleNewTransaction fix');
        await tags('localSend', 'automated', 'regression');

        // Send TON locally to own address and approve
        await wallet.sendTonToSelf('0.001', true);

        // Verify we're back on wallet page (transaction was processed)
        const app = await wallet.open();
        await expect(app.getByTestId('title').filter({ hasText: 'TON Wallet' })).toBeVisible({ timeout: 10000 });

        await wallet.close();
    });
});
