/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { test as base, expect } from '../qa/test-base';
import { testWithGaslessFixture, connectWallet } from '../fixtures/gaslessFixture';
import { MinterPage } from '../pages/MinterPage';
import { mockGaslessConfig, mockGaslessEstimateOk, USDT_MASTER } from '../mocks/gaslessRelayer';
import { gaslessMeta } from '../qa/allure-meta';

/**
 * Gasless NFT mint flow (Generate → Settings → Confirm).
 *
 * Tiers:
 *  - no wallet: the Mint settings gasless toggle is disabled with a reason hint.
 *  - two-tab wallet + mocked relayer: enabling gasless surfaces the Provider /
 *    Fee asset / Gas fee rows in the Confirm dialog; rejecting the signature
 *    recovers cleanly. Nothing is broadcast.
 *  - @real-send: a real gasless mint is broadcast to mainnet (manual run only).
 */

// --- no wallet: gasless toggle is disabled with a reason ---
base.describe('Mint settings (no wallet)', () => {
    base('Without a SignMessage wallet the Gasless toggle is disabled and a reason is shown @allure.id=9876', async ({ page }) => {
        await gaslessMeta('Mint');
        const minter = new MinterPage(page);
        await base.step('Generate a card and open Mint settings', async () => {
            await page.goto('/');
            await minter.generateCard();
            await minter.openMintSettings();
        });
        await base.step('Gasless toggle is disabled and the reason hint is visible', async () => {
            await expect(page.getByText(/^Gasless$/).first()).toBeVisible();
            await expect(minter.gaslessSwitch).toBeDisabled();
            await expect(minter.noSignMessageHint).toBeVisible();
        });
    });
});

// --- two-tab wallet + mocked relayer ---
const test = testWithGaslessFixture({
    appUrl: process.env.MINTER_URL ?? 'http://localhost:5174/',
});

test.describe('Gasless mint (two-tab wallet, mocked relayer)', () => {
    test('Enabling Gasless shows Provider / Fee asset / Gas fee in the Confirm dialog @allure.id=9877', async ({
        app,
        minter,
        widget,
        wallet,
    }) => {
        await gaslessMeta('Mint');
        await mockGaslessConfig(app, { assets: [USDT_MASTER] });
        await mockGaslessEstimateOk(app);

        await test.step('Connect Wallet, generate a card and enable Gasless', async () => {
            await connectWallet({ widget, wallet });
            await minter.generateCard();
            await minter.setMintGasless(true);
            await minter.openMintConfirm();
        });
        await test.step('Provider / Fee asset / Gas fee rows are visible and Confirm is enabled (quote received)', async () => {
            await expect(minter.confirmProviderRow).toBeVisible();
            await expect(minter.confirmFeeAssetRow).toBeVisible();
            await expect(minter.confirmGasFeeRow).toBeVisible();
            await expect(minter.mintFeeAssetSelect).toBeVisible();
            // Confirm is gated on a fresh quote (mint-confirm-modal gating), so an
            // enabled button proves the mocked estimate actually resolved — not just
            // that the gasless flag is on.
            await expect(minter.confirmButton).toBeEnabled();
        });
    });

    test('Rejecting in the wallet keeps the mint recoverable (error shown, does not hang) @allure.id=9862', async ({
        app,
        minter,
        widget,
        wallet,
    }) => {
        await gaslessMeta('Mint');
        await mockGaslessConfig(app, { assets: [USDT_MASTER] });
        // Default `from` echoes the wallet, so the send reaches the SignMessage
        // prompt rather than tripping the WALLET_MISMATCH guard first.
        await mockGaslessEstimateOk(app);

        await test.step('Connect Wallet, generate a card and open Confirm with Gasless', async () => {
            await connectWallet({ widget, wallet });
            await minter.generateCard();
            await minter.setMintGasless(true);
            await minter.openMintConfirm();
        });
        await test.step('Confirm and reject the signature request in the wallet', async () => {
            await expect(minter.confirmButton).toBeEnabled();
            await minter.confirmButton.click();
            await wallet.signMessage(false); // reject the SignMessage request
        });
        await test.step('Confirm dialog closed, error is shown, Mint NFT button is available again', async () => {
            // Confirm modal closes; the inline mint error surfaces and Mint NFT is usable again.
            await expect(minter.errorText.first()).toBeVisible();
            await expect(minter.mintNftButton).toBeEnabled();
        });
    });
});

// --- real on-chain mint (mainnet) — manual run only, broadcasts funds ---
test.describe('Gasless mint (real send)', { tag: '@real-send' }, () => {
    test('Successful Gasless mint lands on-chain', async ({ app, minter, widget, wallet }) => {
        await gaslessMeta('Mint');
        await test.step('Connect Wallet, generate a card and open Confirm with Gasless', async () => {
            await connectWallet({ widget, wallet });
            await minter.generateCard();
            await minter.setMintGasless(true);
            await minter.openMintConfirm();
        });
        await test.step('Confirm, sign and wait for the COMPLETED status', async () => {
            await expect(minter.confirmButton).toBeEnabled();
            await minter.confirmButton.click();
            await wallet.signMessage(true);

            await expect(app.getByText(/COMPLETED/i)).toBeVisible({ timeout: 90_000 });
        });
    });
});
