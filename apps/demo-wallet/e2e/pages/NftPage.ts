/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Page } from '@playwright/test';

/**
 * The `/wallet/nft` screen — a 2-column grid of held NFTs, or a "No NFTs yet"
 * empty state. Tiles render without data-testids (see `nft-tile.tsx`).
 */
export class NftPage {
    constructor(private readonly page: Page) {}

    /** The "NFTs" screen header (ScreenHeader title). */
    get heading() {
        return this.page.getByRole('heading', { name: 'NFTs' });
    }

    /** The empty-state copy shown when the wallet holds no NFTs. */
    get emptyState() {
        return this.page.getByText('No NFTs yet', { exact: true });
    }

    /** A tile located by its NFT name. */
    tile(name: string) {
        return this.page.getByText(name, { exact: true }).first();
    }

    async waitForPage() {
        await this.heading.waitFor({ state: 'visible' });
    }
}
