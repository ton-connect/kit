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
import {
    mockGaslessConfig,
    mockGaslessEstimateOk,
    mockGaslessEstimateError,
    mockGaslessSendError,
    USDT_MASTER,
} from '../mocks/gaslessRelayer';
import type { SendCapture } from '../mocks/gaslessRelayer';
import { gaslessMeta } from '../qa/allure-meta';
import type { MinterPage } from '../pages/MinterPage';

/**
 * Relayer-error handling, driven by mocking the gasless endpoints.
 * The wallet connects (signing is local and free); the relayer is faked so the
 * dApp's guards and error rendering run deterministically with no on-chain send.
 *
 * Rendered error text is asserted against strings the code actually produces:
 *  - HTTP failures → `HTTP <status>: …` (BaseApiClient.buildError)
 *  - non-JSON 200  → "Unexpected non-JSON response" (BaseApiClient)
 *  - expired quote → "…expired…" (send-gasless-transaction QUOTE_EXPIRED guard)
 *  - wrong wallet  → "…different wallet…" (WALLET_MISMATCH guard)
 */
const test = testWithGaslessFixture({
    appUrl: process.env.MINTER_URL ?? 'http://localhost:5174/',
});

async function openGaslessTransfer(minter: MinterPage) {
    await minter.openTransfer(USDT_MASTER);
    await minter.enableGasless();
    await minter.fillTransfer(DEFAULT_RECIPIENT, TRANSFER_AMOUNT);
}

test.describe('Relayer error handling (two-tab wallet, mocked relayer)', () => {
    test('Hostile relayer error string renders safely (no XSS) at the quote error display location @allure.id=9858', async ({
        app,
        minter,
        widget,
        wallet,
    }) => {
        await gaslessMeta('Relayer errors');
        const XSS = '<img src=x onerror=window.__xss=1><script>window.__xss2=1</script>';
        let dialogFired = false;
        app.on('dialog', async (d) => {
            dialogFired = true;
            await d.dismiss();
        });
        await test.step('Mock estimate with an XSS payload in the error body', async () => {
            await mockGaslessConfig(app, { assets: [USDT_MASTER] });
            await mockGaslessEstimateError(app, { status: 400, body: { error: XSS, error_code: 40000 } });
        });
        await test.step('Connect Wallet and fill the Gasless transfer (quote fails with error)', async () => {
            await connectWallet({ widget, wallet });
            await openGaslessTransfer(minter);
        });
        await test.step('Error shown at the real render location — script/image not executed', async () => {
            // exercises the actual quote-error sink (gasless-controls <p class="text-error">)
            await expect(minter.errorText.first()).toBeVisible();
            expect(dialogFired, 'no alert/confirm from the injected string').toBe(false);
            expect(await app.evaluate(() => Boolean((window as never as { __xss?: boolean }).__xss))).toBe(false);
            expect(await app.evaluate(() => Boolean((window as never as { __xss2?: boolean }).__xss2))).toBe(false);
            await expect(app.locator('img[src="x"]')).toHaveCount(0);
        });
    });

    test('Estimate HTTP 400 — quote error shown, send stays blocked @allure.id=9855', async ({
        app,
        minter,
        widget,
        wallet,
    }) => {
        await gaslessMeta('Relayer errors');
        await test.step('Mock config and estimate error (HTTP 400)', async () => {
            await mockGaslessConfig(app, { assets: [USDT_MASTER] });
            await mockGaslessEstimateError(app, {
                status: 400,
                body: { error: 'Jetton is not supported.', error_code: 40000 },
            });
        });
        await test.step('Connect Wallet and open the Gasless transfer', async () => {
            await connectWallet({ widget, wallet });
            await openGaslessTransfer(minter);
        });
        await test.step('Quote error shown as text, "Send Gasless" blocked', async () => {
            // quote error surfaces as plain text; the send button never unlocks
            await expect(minter.errorText.first()).toBeVisible();
            await expect(minter.errorText.first()).toContainText(/HTTP 400/i);
            await expect(minter.sendButton).toBeDisabled();
        });
    });

    test('Estimate returned non-JSON on 200 — handled as a typed error, no crash @allure.id=9864', async ({
        app,
        minter,
        widget,
        wallet,
    }) => {
        await gaslessMeta('Relayer errors');
        const pageErrors: string[] = [];
        await test.step('Mock config and a non-JSON estimate response', async () => {
            app.on('pageerror', (e) => pageErrors.push(e.message));
            await mockGaslessConfig(app, { assets: [USDT_MASTER] });
            await mockGaslessEstimateError(app, { nonJson: true });
        });
        await test.step('Connect Wallet and open the Gasless transfer', async () => {
            await connectWallet({ widget, wallet });
            await openGaslessTransfer(minter);
        });
        await test.step('Non-JSON error shown, no unhandled page errors', async () => {
            await expect(minter.errorText.first()).toContainText(/non-JSON/i);
            expect(pageErrors, `unexpected page errors: ${pageErrors.join('; ')}`).toEqual([]);
        });
    });

    test('Send HTTP 500 — error shown, form recovers (quote re-requested) @allure.id=9875', async ({
        app,
        minter,
        widget,
        wallet,
    }) => {
        await gaslessMeta('Relayer errors');
        const capture: SendCapture = { requests: [] };
        await test.step('Mock config, a successful estimate and a send error (HTTP 500)', async () => {
            await mockGaslessConfig(app, { assets: [USDT_MASTER] });
            await mockGaslessEstimateOk(app);
            await mockGaslessSendError(app, { status: 500, capture });
        });
        await test.step('Connect Wallet and fill the Gasless transfer', async () => {
            await connectWallet({ widget, wallet });
            await openGaslessTransfer(minter);
            await expect(minter.sendButton).toHaveText(/Send Gasless/i);
        });
        await test.step('Sign in the wallet (relayer responds 500)', async () => {
            await minter.sendButton.click();
            await wallet.signMessage(true); // sign; the relayer then 500s
        });
        await test.step('HTTP 500 error shown, button enabled again (quote re-requested)', async () => {
            await expect(minter.errorText.first()).toContainText(/HTTP 500/i);
            expect(capture.requests.length).toBeGreaterThanOrEqual(1);
            // onError invalidates the quote → it re-fetches → the button settles back to an
            // enabled "Send Gasless" (not stuck "Sending…"/"Quoting…").
            await expect(minter.sendButton).toHaveText(/Send Gasless/i);
            await expect(minter.sendButton).toBeEnabled();
        });
    });

    test('WALLET_MISMATCH — a quote bound to a different wallet is rejected before signing @allure.id=9865', async ({
        app,
        minter,
        widget,
        wallet,
    }) => {
        await gaslessMeta('Relayer errors');
        await test.step('Mock config and estimate with a foreign `from` address', async () => {
            await mockGaslessConfig(app, { assets: [USDT_MASTER] });
            // `from` is a different address than the connected wallet → mismatch guard.
            await mockGaslessEstimateOk(app, { from: USDT_MASTER });
        });
        await test.step('Connect Wallet and fill the Gasless transfer', async () => {
            await connectWallet({ widget, wallet });
            await openGaslessTransfer(minter);
            await expect(minter.sendButton).toHaveText(/Send Gasless/i);
        });
        await test.step('Click Send — guard rejects before the signature request', async () => {
            await minter.sendButton.click();
            // No SignMessage prompt — the guard throws before signing.
            await expect(minter.errorText.first()).toContainText(/different wallet/i);
        });
    });

    test('QUOTE_EXPIRED — a stale quote is rejected before signing @allure.id=9860', async ({
        app,
        minter,
        widget,
        wallet,
    }) => {
        await gaslessMeta('Relayer errors');
        await test.step('Mock config and an already expired estimate quote', async () => {
            await mockGaslessConfig(app, { assets: [USDT_MASTER] });
            await mockGaslessEstimateOk(app, { validForSeconds: -60 }); // already expired
        });
        await test.step('Connect Wallet and fill the Gasless transfer', async () => {
            await connectWallet({ widget, wallet });
            await openGaslessTransfer(minter);
            await expect(minter.sendButton).toHaveText(/Send Gasless/i);
        });
        await test.step('Click Send — stale quote error shown', async () => {
            await minter.sendButton.click();
            await expect(minter.errorText.first()).toContainText(/expired/i);
        });
    });

    test('Malformed `from` in the quote is rejected (error shown, send blocked) @allure.id=9854', async ({
        app,
        minter,
        widget,
        wallet,
    }) => {
        await gaslessMeta('Relayer errors');
        await test.step('Mock config and an estimate whose `from` is not a valid address', async () => {
            await mockGaslessConfig(app, { assets: [USDT_MASTER] });
            // an unparseable `from` makes quote mapping fail → quote error, never a usable quote
            await mockGaslessEstimateOk(app, { from: 'not-a-valid-ton-address' });
        });
        await test.step('Connect Wallet and fill the Gasless transfer', async () => {
            await connectWallet({ widget, wallet });
            await openGaslessTransfer(minter);
        });
        await test.step('Quote error is shown and Send never unlocks', async () => {
            await expect(minter.errorText.first()).toBeVisible();
            await expect(minter.sendButton).toBeDisabled();
        });
    });
});
