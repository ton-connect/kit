/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Page } from '@playwright/test';

/**
 * The `/wallet/history` screen — all transactions, with a "Load more" pager
 * (PAGE_SIZE 25). Rows render without data-testids (see `transaction-row.tsx`);
 * a confirmed row is an `<a target="_blank">` to the explorer, a pending row is a
 * plain `<div>`. Locators key on visible title / role.
 */
export class HistoryPage {
    constructor(private readonly page: Page) {}

    /** The "History" screen header (ScreenHeader title). */
    get heading() {
        return this.page.getByRole('heading', { name: 'History' });
    }

    /** The empty-state copy shown when there are no transactions. */
    get emptyState() {
        return this.page.getByText('No transactions yet', { exact: true });
    }

    /** The "Load more" pager button (only present when more pages remain). */
    get loadMore() {
        return this.page.getByRole('button', { name: 'Load more' });
    }

    /** A row located by its title text (e.g. "Sent 5 GRAM"). */
    rowByTitle(title: string) {
        return this.page.getByText(title, { exact: true }).first();
    }

    /** The explorer link `<a>` wrapping a row whose title matches (confirmed rows only). */
    explorerLinkByTitle(title: string) {
        return this.page.locator('a[target="_blank"]', { hasText: title });
    }

    async waitForPage() {
        await this.heading.waitFor({ state: 'visible' });
    }
}
