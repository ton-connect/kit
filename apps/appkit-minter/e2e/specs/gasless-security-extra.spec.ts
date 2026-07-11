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
import {
    mockGaslessConfig,
    mockGaslessEstimateOk,
    mockGaslessSendSequence,
    USDT_MASTER,
} from '../mocks/gaslessRelayer';
import type { SendCapture } from '../mocks/gaslessRelayer';

/**
 * Resilience to a transient relayer error: the first send responds 503,
 * and the SDK retries the request. We verify the retry happens by counting
 * requests (without a real network). The relayer is mocked.
 */
const test = testWithGaslessFixture({
    appUrl: process.env.MINTER_URL ?? 'http://localhost:5174/',
});

test.describe('Gasless transfer — resilience to relayer errors', () => {
    test('Transient send error (503) triggers a retry request @allure.id=9853', async ({ app, minter, widget, wallet }) => {
        await gaslessMeta('Relayer errors');
        const capture: SendCapture = { requests: [] };
        await mockGaslessConfig(app, { assets: [USDT_MASTER] });
        await mockGaslessEstimateOk(app);
        await mockGaslessSendSequence(app, [503, 200], capture);

        await test.step('Connect Wallet and fill in the gasless transfer', async () => {
            await connectWallet({ widget, wallet });
            await minter.openTransfer(USDT_MASTER);
            await minter.enableGasless();
            await minter.fillTransfer(DEFAULT_RECIPIENT, TRANSFER_AMOUNT);
            await expect(minter.sendButton).toHaveText(/Send Gasless/i);
        });
        await test.step('Sign in the wallet — first send 503, retry performed', async () => {
            await minter.sendButton.click();
            await wallet.signMessage(true);
            // SDK retries /send on a transient 5xx → at least two POSTs reach the relayer.
            await expect.poll(() => capture.requests.length, { timeout: 20_000 }).toBeGreaterThanOrEqual(2);
        });
    });
});
