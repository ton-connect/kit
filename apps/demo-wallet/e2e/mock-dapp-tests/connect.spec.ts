/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect } from '@playwright/test';

import { mockDappFixture } from '../ton-connect/mockDappFixture';

/**
 * Mock-first two-tab TON Connect — connect modal.
 *
 * Tab 1 = the self-contained QA Mock dApp (:5175). Tab 2 = the redesigned demo-wallet (:5173).
 * `dapp.connectUrl()` clicks the dApp's Connect button and reads the universal link straight
 * off `#dapp-connect-url` (no modal, no clipboard). `wallet.connectBy(url, false, confirm)`
 * pastes it into the wallet's "Connect to dApp" flow and drives the redesigned per-type
 * `connect-request` modal (`connect-approve` / `connect-reject`). The handshake rides the real
 * TON Connect bridge.
 */
const test = mockDappFixture();

test.describe('TON Connect mock-dApp — connect (two-tab)', () => {
    test('@allure.id=10135 Approving the connect request connects the wallet to the dApp', async ({ wallet, dapp }) => {
        const url = await dapp.connectUrl();
        // Bring the modal up (skip the atomic approve), assert the redesigned copy + buttons, then approve.
        await wallet.connectBy(url, /* shouldSkipConnect */ true);
        await wallet.expectConnectModal();
        await wallet.connect(true);

        // The connector reports a connected wallet (status change → #dapp-connected === 'true').
        await expect(await dapp.isConnected()).toBe(true);
    });

    test('@allure.id=10131 Rejecting the connect request leaves the dApp disconnected', async ({ wallet, dapp }) => {
        const url = await dapp.connectUrl();
        await wallet.connectBy(url, /* shouldSkipConnect */ true);
        await wallet.expectConnectModal();
        await wallet.connect(false);

        // Terminal signal: the rejection round-trips over the bridge and the connector reports
        // it via onStatusChange's error handler → #dapp-error. (Asserting only an empty
        // #dapp-connected would be a false pass: that's also the initial pre-connect state.)
        const err = await dapp.error();
        expect(err.length).toBeGreaterThan(0);
        // …and the connector never flipped to connected.
        await expect(dapp.page.getByTestId('dapp-connected')).not.toHaveText('true');
    });
});
