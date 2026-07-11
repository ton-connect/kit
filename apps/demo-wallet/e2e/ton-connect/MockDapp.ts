/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Page } from '@playwright/test';
import { step } from 'allure-js-commons';

/**
 * Page-object over the QA Mock dApp (`e2e/mock-dapp/`, served on :5175) — the raw
 * `@tonconnect/sdk` driver tab for the two-tab demo-wallet e2e suite.
 *
 * Unlike {@link TonConnectWidget} (which scrapes the appkit connect modal + clipboard),
 * the mock-dApp surfaces everything we need into stable-testid DOM elements, so this
 * driver just clicks a button and reads text: no modal, no clipboard. Each request kind
 * writes its outcome into `#dapp-result` (success) or `#dapp-error` (rejection/failure),
 * which {@link result} / {@link error} poll.
 */
export class MockDapp {
    constructor(readonly page: Page) {}

    /** Click "Connect" and return the universal link the connector generated (`tc://…`). */
    async connectUrl(): Promise<string> {
        await this.page.getByTestId('dapp-connect').click();
        const url = this.page.getByTestId('dapp-connect-url');
        await url.waitFor({ state: 'visible' });
        // The link is written synchronously on click; wait until it is non-empty.
        await this.page.waitForFunction(() => {
            const el = document.getElementById('dapp-connect-url');
            return !!el && el.textContent !== null && el.textContent.length > 0;
        });
        return (await url.textContent()) ?? '';
    }

    /** Resolves once the connector reports a connected wallet (`#dapp-connected` === 'true'). */
    async isConnected(): Promise<boolean> {
        await this.page.waitForFunction(() => document.getElementById('dapp-connected')?.textContent === 'true');
        return true;
    }

    /** Issue a sendTransaction request (tiny amount; the wallet never broadcasts). */
    async sendTransaction(): Promise<void> {
        await this.page.getByTestId('dapp-send-tx').click();
    }

    /** Issue a signData (text) request. */
    async signData(): Promise<void> {
        await this.page.getByTestId('dapp-sign-data').click();
    }

    /** Issue a signMessage request (the wallet signs the internal message without broadcasting). */
    async signMessage(): Promise<void> {
        await this.page.getByTestId('dapp-sign-message').click();
    }

    /** Wait for and return the last success result text (`#dapp-result`, JSON or 'ok'). */
    async result(): Promise<string> {
        await this.page.waitForFunction(() => {
            const el = document.getElementById('dapp-result');
            return !!el && el.textContent !== null && el.textContent.length > 0;
        });
        return (await this.page.getByTestId('dapp-result').textContent()) ?? '';
    }

    /**
     * Fire TWO requests back-to-back (signData then signMessage) WITHOUT awaiting the first, to
     * exercise the wallet's request queue. Returns immediately after the click; the requests settle
     * asynchronously (track via {@link settledCount}).
     */
    async fireTwoRequests(): Promise<void> {
        await step('Fire two TON Connect requests without awaiting the first', async () => {
            await this.page.getByTestId('dapp-two-requests').click();
        });
    }

    /** Current number of requests that have settled since `fireTwoRequests()` (`#dapp-settled-count`). */
    async settledCount(): Promise<number> {
        const text = (await this.page.getByTestId('dapp-settled-count').textContent()) ?? '0';
        return Number.parseInt(text, 10) || 0;
    }

    /** Wait until exactly `n` of the fired requests have settled. */
    async waitForSettledCount(n: number): Promise<void> {
        await step(`Wait until ${n} request(s) have settled on the dApp`, async () => {
            await this.page.waitForFunction(
                (expected) => document.getElementById('dapp-settled-count')?.textContent === String(expected),
                n,
            );
        });
    }

    /** Wait for and return the last error text (`#dapp-error`). */
    async error(): Promise<string> {
        await this.page.waitForFunction(() => {
            const el = document.getElementById('dapp-error');
            return !!el && el.textContent !== null && el.textContent.length > 0;
        });
        return (await this.page.getByTestId('dapp-error').textContent()) ?? '';
    }
}
