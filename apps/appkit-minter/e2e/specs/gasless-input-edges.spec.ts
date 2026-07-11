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
import { mockGaslessConfig, mockGaslessEstimateOk, USDT_MASTER } from '../mocks/gaslessRelayer';
import { gaslessMeta } from '../qa/allure-meta';

/**
 * Transfer-form input edge cases under gasless. The relayer is
 * mocked so any failure is attributable to the input, not the network.
 */
const test = testWithGaslessFixture({
    appUrl: process.env.MINTER_URL ?? 'http://localhost:5174/',
});

test.describe('Transfer-form input edge cases (two-tab wallet, mocked relayer)', () => {
    test('Invalid recipient address is rejected — error shown, send blocked @allure.id=9873', async ({
        app,
        minter,
        widget,
        wallet,
    }) => {
        await gaslessMeta('Input');
        await test.step('Mock relayer config and estimate', async () => {
            await mockGaslessConfig(app, { assets: [USDT_MASTER] });
            await mockGaslessEstimateOk(app);
        });
        await test.step('Connect wallet, enable Gasless and enter an invalid address', async () => {
            await connectWallet({ widget, wallet });
            await minter.openTransfer(USDT_MASTER);
            await minter.enableGasless();
            // build/parse of the message fails client-side before any request goes out
            await minter.fillTransfer('this-is-not-a-ton-address', TRANSFER_AMOUNT);
        });
        await test.step('Error shown, send button disabled', async () => {
            await expect(minter.errorText.first()).toBeVisible();
            await expect(minter.sendButton).toBeDisabled();
        });
    });

    test('Empty amount blocks Send; filling a valid amount unblocks it (comment with special characters does not interfere) @allure.id=9857', async ({
        app,
        minter,
        widget,
        wallet,
    }) => {
        await gaslessMeta('Input');
        await test.step('Mock relayer config and estimate', async () => {
            await mockGaslessConfig(app, { assets: [USDT_MASTER] });
            await mockGaslessEstimateOk(app);
        });

        await test.step('Connect wallet, enable Gasless, set recipient and a special-character comment', async () => {
            await connectWallet({ widget, wallet });
            await minter.openTransfer(USDT_MASTER);
            await minter.enableGasless();
            await minter.recipientInput.fill(DEFAULT_RECIPIENT);
            await minter.commentInput.fill('<img src=x onerror=1> & "quotes" \'апостроф\'');
        });
        await test.step('With an empty amount Send is disabled', async () => {
            await expect(minter.amountInput).toHaveValue('');
            await expect(minter.sendButton).toBeDisabled();
        });
        await test.step('After entering a valid amount Send becomes active as «Send Gasless»', async () => {
            await minter.amountInput.fill(TRANSFER_AMOUNT);
            await expect(minter.sendButton).toHaveText(/Send Gasless/i);
            await expect(minter.sendButton).toBeEnabled();
        });
    });
});
