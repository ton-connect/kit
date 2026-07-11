/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect } from '@playwright/test';

import { testWithGaslessFixture, connectWallet } from '../fixtures/gaslessFixture';
import { DEFAULT_RECIPIENT, TRANSFER_AMOUNT } from '../constants';
import { gaslessMeta } from '../qa/allure-meta';
import { mockGaslessConfig, mockGaslessEstimateOk, mockGaslessSendOk, USDT_MASTER } from '../mocks/gaslessRelayer';
import type { SendCapture } from '../mocks/gaslessRelayer';

/**
 * Gasless jetton transfer via the demo wallet (two-tab fixture).
 * Requires WALLET_MNEMONIC (V5 wallet with SignMessage holding the jetton). The relayer
 * is mocked — no funds are spent and TonAPI is not hit; the exception is the test tagged
 * `@real-send`, which actually broadcasts to mainnet (manual run only).
 */
const test = testWithGaslessFixture({
    appUrl: process.env.MINTER_URL ?? 'http://localhost:5174/',
});

test.describe('Gasless jetton transfer', () => {
    test('USDT is selected automatically, quote loads, Send Gasless button is enabled @allure.id=9878', async ({
        app,
        minter,
        widget,
        wallet,
    }) => {
        await gaslessMeta('Transfer');
        await mockGaslessConfig(app, { assets: [USDT_MASTER] });
        await mockGaslessEstimateOk(app);

        await test.step('Connect wallet', () => connectWallet({ widget, wallet }));
        await test.step('Open USDT transfer and enable Gasless', async () => {
            await minter.openTransfer(USDT_MASTER);
            await minter.enableGasless();
        });
        await test.step('Fill recipient and amount', () => minter.fillTransfer(DEFAULT_RECIPIENT, TRANSFER_AMOUNT));
        await test.step('Quote loaded — Send Gasless is enabled', async () => {
            await expect(minter.sendButton).toHaveText(/Send Gasless/i);
            await expect(minter.sendButton).toBeEnabled();
        });
    });

    test('Relayer request is built correctly (without a real send) @allure.id=9850', async ({ app, minter, widget, wallet }) => {
        await gaslessMeta('Transfer');
        const capture: SendCapture = { requests: [] };
        await mockGaslessConfig(app, { assets: [USDT_MASTER] });
        await mockGaslessEstimateOk(app);
        await mockGaslessSendOk(app, { capture });

        await test.step('Connect wallet and fill the gasless transfer', async () => {
            await connectWallet({ widget, wallet });
            await minter.openTransfer(USDT_MASTER);
            await minter.enableGasless();
            await minter.fillTransfer(DEFAULT_RECIPIENT, TRANSFER_AMOUNT);
            await expect(minter.sendButton).toHaveText(/Send Gasless/i);
        });
        await test.step('Sign in the wallet (locally, without broadcast)', async () => {
            await minter.sendButton.click();
            await wallet.signMessage(true);
        });
        await test.step('Exactly one valid request sent — pubkey + non-empty BoC', async () => {
            await expect.poll(() => capture.requests.length).toBe(1);
            expect(capture.requests[0]?.boc, 'request contains a signed BoC').toBeTruthy();
            expect(capture.requests[0]?.wallet_public_key, 'request contains the public key').toBeTruthy();
        });
    });

    test('Sign rejection in the wallet — form recovers, error is shown @allure.id=9872', async ({ app, minter, widget, wallet }) => {
        await gaslessMeta('Transfer');
        await mockGaslessConfig(app, { assets: [USDT_MASTER] });
        await mockGaslessEstimateOk(app);

        await test.step('Connect wallet and fill the gasless transfer', async () => {
            await connectWallet({ widget, wallet });
            await minter.openTransfer(USDT_MASTER);
            await minter.enableGasless();
            await minter.fillTransfer(DEFAULT_RECIPIENT, TRANSFER_AMOUNT);
            await expect(minter.sendButton).toHaveText(/Send Gasless/i);
        });
        await test.step('Reject the sign request in the wallet', async () => {
            await minter.sendButton.click();
            await wallet.signMessage(false);
        });
        await test.step('Form recovered, fields preserved, error is shown', async () => {
            await expect(minter.sendButton).toHaveText(/Send Gasless/i);
            await expect(minter.sendButton).toBeEnabled();
            await expect(minter.recipientInput).toHaveValue(DEFAULT_RECIPIENT);
            await expect(minter.errorText.first()).toBeVisible();
        });
    });
});

// --- real on-chain send (mainnet) — manual run only, broadcasts funds ---
test.describe('Gasless jetton transfer (real send) @real-send', () => {
    test('Successful gasless send goes through on-chain', async ({ app, minter, widget, wallet }) => {
        await gaslessMeta('Transfer');
        await test.step('Connect wallet and fill the gasless transfer', async () => {
            await connectWallet({ widget, wallet });
            await minter.openTransfer(USDT_MASTER);
            await minter.enableGasless();
            await minter.fillTransfer(DEFAULT_RECIPIENT, TRANSFER_AMOUNT);
            await expect(minter.sendButton).toHaveText(/Send Gasless/i);
        });
        await test.step('Sign and wait for COMPLETED status', async () => {
            await minter.sendButton.click();
            await wallet.signMessage(true);
            await expect(app.getByText(/COMPLETED/i)).toBeVisible({ timeout: 90_000 });
            await expect(minter.sendButton).toHaveCount(0);
        });
    });
});
