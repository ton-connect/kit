/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect } from '@playwright/test';
import { step } from 'allure-js-commons';

import { testWithUIFixture } from './UITestFixture';
import { createWalletOnDashboard } from './helpers';
import { HistoryPage } from '../pages';
import { mockWalletApi } from '../mocks/walletApi';
import type { MockEvent } from '../mocks/walletApi';

const test = testWithUIFixture();

/** A valid 32-byte base64 trace id derived from an index (Base64ToHex decodes it to the row id). */
const traceId = (i: number): string => Buffer.alloc(32, i + 1).toString('base64');

test.describe('History page (mocked wallet API)', () => {
    test('@allure.id=10096 Renders sent/received GRAM rows with status', async ({ webOnly: _webOnly, page }) => {
        // Default mock shapes one outgoing 5 GRAM + one incoming 2.5 GRAM transfer; both succeed,
        // so each row shows its "Sent/Received N GRAM" title (see map-transaction-row.ts).
        await mockWalletApi(page);
        await createWalletOnDashboard(page);

        const history = new HistoryPage(page);
        await step('Open the transaction history', async () => {
            await page.getByRole('button', { name: 'View all transactions' }).click();
            await history.waitForPage();
        });

        await step('Verify sent/received GRAM rows render with status', async () => {
            await expect(history.rowByTitle('Sent 5 GRAM')).toBeVisible();
            await expect(history.rowByTitle('Received 2.5 GRAM')).toBeVisible();
        });
    });

    test('@allure.id=10119 A confirmed row links to the explorer in a new tab', async ({ webOnly: _webOnly, page }) => {
        // A confirmed row is an <a target="_blank"> to the network's tonviewer host. The wallet was
        // created on mainnet, so the host is tonviewer.com (testnet/tetra switch the host).
        await mockWalletApi(page);
        await createWalletOnDashboard(page);

        const history = new HistoryPage(page);
        await step('Open the transaction history', async () => {
            await page.getByRole('button', { name: 'View all transactions' }).click();
            await history.waitForPage();
        });

        await step('Verify a confirmed row links to the explorer in a new tab', async () => {
            const link = history.explorerLinkByTitle('Sent 5 GRAM');
            await expect(link).toBeVisible();
            await expect(link).toHaveAttribute('target', '_blank');
            const href = await link.getAttribute('href');
            expect(href).toBeTruthy();
            expect(new URL(href!).host).toBe('tonviewer.com');
            expect(new URL(href!).pathname).toContain('/transaction/');
        });
    });

    test('@allure.id=10118 Shows "Load more" when more pages remain', async ({ webOnly: _webOnly, page }) => {
        // hasNext is true when a page returns >= limit traces (PAGE_SIZE 25). Shape 25 sent rows so
        // the first page is full and the pager appears.
        const events: MockEvent[] = Array.from({ length: 25 }, (_value, i) => ({
            traceId: traceId(i),
            direction: 'sent' as const,
            amountNano: '1000000000',
            timestamp: 1_700_000_000 + i,
        }));
        await mockWalletApi(page, { events });
        await createWalletOnDashboard(page);

        const history = new HistoryPage(page);
        await step('Open the transaction history', async () => {
            await page.getByRole('button', { name: 'View all transactions' }).click();
            await history.waitForPage();
        });

        await step('Verify "Load more" is shown when more pages remain', async () => {
            await expect(history.loadMore).toBeVisible();
        });
    });
});
