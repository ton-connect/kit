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
import { mockGaslessConfig, mockGaslessEstimateOk, USDT_MASTER } from '../mocks/gaslessRelayer';

/**
 * Gasless block and transfer-form state (without sending).
 * The relayer is mocked; these tests only verify the UI states of the transfer modal.
 */
const test = testWithGaslessFixture({
    appUrl: process.env.MINTER_URL ?? 'http://localhost:5174/',
});

test.describe('Gasless transfer form — states', () => {
    test('Fee asset selector is hidden while Gasless is off @allure.id=9870', async ({ app, minter, widget, wallet }) => {
        await gaslessMeta('Transfer');
        await mockGaslessConfig(app, { assets: [USDT_MASTER] });
        await test.step('Connect Wallet and open USDT transfer (Gasless off)', async () => {
            await connectWallet({ widget, wallet });
            await minter.openTransfer(USDT_MASTER);
        });
        await test.step('Gasless checkbox is unchecked, no Fee asset selector', async () => {
            await expect(minter.gaslessCheckbox).not.toBeChecked();
            await expect(minter.feeAssetSelect).toHaveCount(0);
        });
    });

    test('Fee asset selector appears when Gasless is enabled @allure.id=9871', async ({ app, minter, widget, wallet }) => {
        await gaslessMeta('Transfer');
        await mockGaslessConfig(app, { assets: [USDT_MASTER] });
        await test.step('Connect Wallet, open USDT transfer and enable Gasless', async () => {
            await connectWallet({ widget, wallet });
            await minter.openTransfer(USDT_MASTER);
            await minter.enableGasless();
        });
        await test.step('Fee asset selector appeared', async () => {
            await expect(minter.feeAssetSelect).toBeVisible();
        });
    });

    test('With Gasless off the send button is the regular one — not "Send Gasless" @allure.id=9851', async ({
        app,
        minter,
        widget,
        wallet,
    }) => {
        await gaslessMeta('Transfer');
        await mockGaslessConfig(app, { assets: [USDT_MASTER] });
        await test.step('Connect Wallet, open USDT transfer and fill the fields', async () => {
            await connectWallet({ widget, wallet });
            await minter.openTransfer(USDT_MASTER);
            await minter.fillTransfer(DEFAULT_RECIPIENT, TRANSFER_AMOUNT);
        });
        await test.step('Send button is the regular "Send …", without "Gasless"', async () => {
            await expect(minter.sendButton).toHaveText(/Send/i);
            await expect(minter.sendButton).not.toHaveText(/Gasless/i);
        });
    });

    test('Recipient and amount are preserved when Gasless is enabled @allure.id=9880', async ({ app, minter, widget, wallet }) => {
        await gaslessMeta('Transfer');
        await mockGaslessConfig(app, { assets: [USDT_MASTER] });
        await mockGaslessEstimateOk(app);
        await test.step('Connect Wallet, open USDT transfer and fill the fields', async () => {
            await connectWallet({ widget, wallet });
            await minter.openTransfer(USDT_MASTER);
            await minter.fillTransfer(DEFAULT_RECIPIENT, TRANSFER_AMOUNT);
        });
        await test.step('Enable Gasless — field values are not reset', async () => {
            await minter.enableGasless();
            await expect(minter.recipientInput).toHaveValue(DEFAULT_RECIPIENT);
            await expect(minter.amountInput).toHaveValue(TRANSFER_AMOUNT);
        });
    });

    test('Toggling Gasless back and forth does not break the form @allure.id=9861', async ({ app, minter, widget, wallet }) => {
        await gaslessMeta('Transfer');
        await mockGaslessConfig(app, { assets: [USDT_MASTER] });
        await mockGaslessEstimateOk(app);
        await test.step('Connect Wallet, open USDT transfer and fill the fields', async () => {
            await connectWallet({ widget, wallet });
            await minter.openTransfer(USDT_MASTER);
            await minter.fillTransfer(DEFAULT_RECIPIENT, TRANSFER_AMOUNT);
        });
        await test.step('Enable → disable → enable Gasless', async () => {
            await minter.gaslessCheckbox.check();
            await expect(minter.feeAssetSelect).toBeVisible();
            await minter.gaslessCheckbox.uncheck();
            await expect(minter.feeAssetSelect).toHaveCount(0);
            await minter.gaslessCheckbox.check();
        });
        await test.step('Form is intact: fields in place, selector visible again', async () => {
            await expect(minter.recipientInput).toHaveValue(DEFAULT_RECIPIENT);
            await expect(minter.amountInput).toHaveValue(TRANSFER_AMOUNT);
            await expect(minter.feeAssetSelect).toBeVisible();
        });
    });

    test('Closing via "Cancel" resets the form on reopen @allure.id=9868', async ({ app, minter, widget, wallet }) => {
        await gaslessMeta('Transfer');
        await mockGaslessConfig(app, { assets: [USDT_MASTER] });
        await test.step('Connect Wallet, open USDT transfer and fill the recipient', async () => {
            await connectWallet({ widget, wallet });
            await minter.openTransfer(USDT_MASTER);
            await minter.fillTransfer(DEFAULT_RECIPIENT, TRANSFER_AMOUNT);
        });
        await test.step('Click "Cancel"', () => app.getByRole('button', { name: /^Cancel$/ }).click());
        await test.step('Reopen the transfer — fields are empty', async () => {
            await minter.openTransfer(USDT_MASTER);
            await expect(minter.recipientInput).toHaveValue('');
            await expect(minter.amountInput).toHaveValue('');
        });
    });

    // The "USDT absent → first asset auto-selected" case needs the relayer /config mocked
    // BEFORE the app's eager on-load fetch (which otherwise caches the real config that
    // includes USDT). That requires a pre-navigation route hook in the fixture — tracked
    // in the backlog; the post-goto mock here can't override the cached config.

    test('No quote is requested while inputs are incomplete @allure.id=9879', async ({ app, minter, widget, wallet }) => {
        await gaslessMeta('Transfer');
        const estimates: string[] = [];
        await mockGaslessConfig(app, { assets: [USDT_MASTER] });
        await mockGaslessEstimateOk(app, { capture: estimates });
        await test.step('Connect Wallet, open USDT transfer, enable Gasless, fill recipient only', async () => {
            await connectWallet({ widget, wallet });
            await minter.openTransfer(USDT_MASTER);
            await minter.enableGasless();
            await minter.recipientInput.fill(DEFAULT_RECIPIENT); // amount intentionally left empty
        });
        await test.step('No estimate request fires and Send stays blocked', async () => {
            await app.waitForTimeout(1500);
            expect(estimates.length, 'no /estimate call without a full input set').toBe(0);
            await expect(minter.sendButton).toBeDisabled();
        });
    });

    test('Send shows "Quoting…" while the estimate is in flight, then settles @allure.id=9863', async ({
        app,
        minter,
        widget,
        wallet,
    }) => {
        await gaslessMeta('Transfer');
        await mockGaslessConfig(app, { assets: [USDT_MASTER] });
        await mockGaslessEstimateOk(app, { delayMs: 4000 }); // slow quote → observable "Quoting…"
        await test.step('Connect Wallet, open USDT transfer, enable Gasless and fill the fields', async () => {
            await connectWallet({ widget, wallet });
            await minter.openTransfer(USDT_MASTER);
            await minter.enableGasless();
            await minter.fillTransfer(DEFAULT_RECIPIENT, TRANSFER_AMOUNT);
        });
        await test.step('Button reads "Quoting…" during the request', async () => {
            await expect(minter.sendButton).toHaveText(/Quoting/i);
        });
        await test.step('Once the quote arrives it settles to an enabled "Send Gasless"', async () => {
            await expect(minter.sendButton).toHaveText(/Send Gasless/i);
            await expect(minter.sendButton).toBeEnabled();
        });
    });

    test('Changing the amount re-requests the quote @allure.id=9915', async ({ app, minter, widget, wallet }) => {
        await gaslessMeta('Transfer');
        const estimates: string[] = [];
        await mockGaslessConfig(app, { assets: [USDT_MASTER] });
        await mockGaslessEstimateOk(app, { capture: estimates });
        await test.step('Connect Wallet, open USDT transfer, enable Gasless and fill the fields', async () => {
            await connectWallet({ widget, wallet });
            await minter.openTransfer(USDT_MASTER);
            await minter.enableGasless();
            await minter.fillTransfer(DEFAULT_RECIPIENT, TRANSFER_AMOUNT);
            await expect(minter.sendButton).toHaveText(/Send Gasless/i);
        });
        let beforeChange = 0;
        await test.step('Change the amount → a NEW estimate request fires', async () => {
            beforeChange = estimates.length;
            await minter.amountInput.fill('0.07');
            await expect.poll(() => estimates.length).toBeGreaterThan(beforeChange);
        });
    });

    test('Changing the recipient re-requests the quote @allure.id=9916', async ({ app, minter, widget, wallet }) => {
        await gaslessMeta('Transfer');
        const estimates: string[] = [];
        await mockGaslessConfig(app, { assets: [USDT_MASTER] });
        await mockGaslessEstimateOk(app, { capture: estimates });
        await test.step('Connect Wallet, open USDT transfer, enable Gasless and fill the fields', async () => {
            await connectWallet({ widget, wallet });
            await minter.openTransfer(USDT_MASTER);
            await minter.enableGasless();
            await minter.fillTransfer(DEFAULT_RECIPIENT, TRANSFER_AMOUNT);
            await expect(minter.sendButton).toHaveText(/Send Gasless/i);
        });
        let beforeChange = 0;
        await test.step('Change the recipient → a NEW estimate request fires', async () => {
            beforeChange = estimates.length;
            // a DIFFERENT valid address than DEFAULT_RECIPIENT, so the quote key actually changes
            await minter.recipientInput.fill(USDT_MASTER);
            await expect.poll(() => estimates.length).toBeGreaterThan(beforeChange);
        });
    });

    test('Closing via Escape resets the form on reopen @allure.id=9914', async ({ app, minter, widget, wallet }) => {
        await gaslessMeta('Transfer');
        await mockGaslessConfig(app, { assets: [USDT_MASTER] });
        await test.step('Connect Wallet, open USDT transfer and fill the fields', async () => {
            await connectWallet({ widget, wallet });
            await minter.openTransfer(USDT_MASTER);
            await minter.fillTransfer(DEFAULT_RECIPIENT, TRANSFER_AMOUNT);
        });
        await test.step('Press Escape to close the modal', () => app.keyboard.press('Escape'));
        await test.step('Reopen the transfer — fields are empty', async () => {
            await minter.openTransfer(USDT_MASTER);
            await expect(minter.recipientInput).toHaveValue('');
            await expect(minter.amountInput).toHaveValue('');
        });
    });
});
