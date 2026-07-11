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

/** A second relayer-accepted fee asset (NOT master) — for the re-quote race. */
const NOT_MASTER = 'EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT';

/**
 * Concurrency guards on the gasless transfer form, with the
 * relayer mocked (no broadcast).
 */
const test = testWithGaslessFixture({
    appUrl: process.env.MINTER_URL ?? 'http://localhost:5174/',
});

test.describe('Gasless transfer races (two-tab wallet, mocked relayer)', () => {
    test('Double-send protection — one click yields exactly one relayer send @allure.id=9874', async ({
        app,
        minter,
        widget,
        wallet,
    }) => {
        await gaslessMeta('Races');
        const capture: SendCapture = { requests: [] };
        await test.step('Mock the relayer and fill the gasless transfer', async () => {
            await mockGaslessConfig(app, { assets: [USDT_MASTER] });
            await mockGaslessEstimateOk(app);
            await mockGaslessSendOk(app, { capture });

            await connectWallet({ widget, wallet });
            await minter.openTransfer(USDT_MASTER);
            await minter.enableGasless();
            await minter.fillTransfer(DEFAULT_RECIPIENT, TRANSFER_AMOUNT);
            await expect(minter.sendButton).toHaveText(/Send Gasless/i);
        });

        await test.step('Click "Send Gasless" and sign in the wallet', async () => {
            // While the send is in flight the button enters its loading state (no label,
            // disabled), so a rapid second click can't start a second send. We assert the
            // observable guarantee: exactly one relayer send for one user click + signature.
            await minter.sendButton.click();
            await wallet.signMessage(true);
        });

        await test.step('Exactly one request sent and no duplicate appeared', async () => {
            await expect.poll(() => capture.requests.length, { timeout: 20_000 }).toBe(1);
            // give any erroneous duplicate a chance to surface, then re-assert it stayed at one
            await app.waitForTimeout(1500);
            expect(capture.requests.length).toBe(1);
        });
    });

    test('Switching the fee asset re-requests the quote — the form follows the new selection @allure.id=9848', async ({
        app,
        minter,
        widget,
        wallet,
    }) => {
        await gaslessMeta('Races');
        const estimates: string[] = [];
        await test.step('Mock the relayer with two assets and fill the gasless transfer', async () => {
            await mockGaslessConfig(app, { assets: [USDT_MASTER, NOT_MASTER] });
            await mockGaslessEstimateOk(app, { capture: estimates });

            await connectWallet({ widget, wallet });
            await minter.openTransfer(USDT_MASTER);
            await minter.enableGasless();
            await minter.fillTransfer(DEFAULT_RECIPIENT, TRANSFER_AMOUNT);
            await expect(minter.sendButton).toHaveText(/Send Gasless/i);
        });

        let beforeSwitch = 0;
        await test.step('Switch the Fee asset → a NEW quote request fires', async () => {
            beforeSwitch = estimates.length;
            await minter.feeAssetSelect.selectOption(NOT_MASTER);
            await expect(minter.feeAssetSelect).toHaveValue(NOT_MASTER);
            // a real re-quote fired (not the stale one reused)
            await expect.poll(() => estimates.length).toBeGreaterThan(beforeSwitch);
        });

        await test.step('Form returned to its active state with the new asset', async () => {
            await expect(minter.sendButton).toHaveText(/Send Gasless/i);
            await expect(minter.sendButton).toBeEnabled();
        });
    });
});
