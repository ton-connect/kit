/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Page } from '@playwright/test';

/**
 * The `/wallet/assets` screen — the full token list (GRAM row first, then jettons
 * sorted by fiat desc). Each row is an `asset-row` testid with an `asset-fiat` cell
 * (see `asset-row.tsx`); name/symbol locators key on the visible text.
 */
export class AssetsPage {
    constructor(private readonly page: Page) {}

    /** The "Assets" screen header (ScreenHeader title). */
    get heading() {
        return this.page.getByRole('heading', { name: 'Assets' });
    }

    /** The native GRAM row's name cell ("Gram"). */
    get gramName() {
        return this.page.getByText('Gram', { exact: true }).first();
    }

    /** The native GRAM asset row (the row whose name reads "Gram"). */
    get gramRow() {
        return this.page.getByTestId('asset-row').filter({ hasText: 'Gram' });
    }

    /** The fiat value cell of the GRAM row. */
    get gramFiat() {
        return this.gramRow.getByTestId('asset-fiat');
    }

    /** The GRAM row icon (`/gram.svg`). */
    get gramIcon() {
        return this.page.locator('img[src="/gram.svg"]').first();
    }

    /** A row located by its asset name (e.g. "Tether USD"). */
    nameCell(name: string) {
        return this.page.getByText(name, { exact: true }).first();
    }

    /** A FallbackImage gradient circle's two-letter text (shown when every icon URL fails). */
    fallbackText(text: string) {
        return this.page.getByText(text, { exact: true });
    }

    async waitForPage() {
        await this.heading.waitFor({ state: 'visible' });
    }
}
