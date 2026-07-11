/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect } from '@playwright/test';

import { testWithUIFixture } from './UITestFixture';
import { createWalletOnDashboard } from './helpers';
import { NftPage } from '../pages';
import { mockWalletApi } from '../mocks/walletApi';

const test = testWithUIFixture();

test.describe('NFT page (mocked wallet API)', () => {
    test('@allure.id=10127 Renders the grid of held NFTs', async ({ webOnly: _webOnly, page }) => {
        // Default mock: 2 NFTs. The dashboard NftsCard renders its "View all NFTs" link only when
        // the wallet holds NFTs; following it lands on the 2-column grid showing the same items.
        await mockWalletApi(page);
        await createWalletOnDashboard(page);

        const nft = new NftPage(page);
        await page.getByRole('button', { name: 'View all NFTs' }).click();
        await nft.waitForPage();

        await expect(nft.tile('Test NFT One')).toBeVisible();
        await expect(nft.tile('Test NFT Two')).toBeVisible();
    });

    test('@allure.id=10104 Hides the dashboard NFTs entry when the wallet holds no NFTs', async ({
        webOnly: _webOnly,
        page,
    }) => {
        // empty-section-hides: with 0 NFTs the NftsCard renders nothing, so there is no
        // "View all NFTs" link — the only entry point to /wallet/nft is removed.
        await mockWalletApi(page, { nfts: [] });
        await createWalletOnDashboard(page);

        await expect(page.getByRole('button', { name: 'View all NFTs' })).toBeHidden();
        await expect(page.getByRole('heading', { name: 'NFTs' })).toBeHidden();
    });
});
