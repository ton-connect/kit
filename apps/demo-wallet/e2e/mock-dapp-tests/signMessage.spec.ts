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
 * Mock-first two-tab TON Connect — signMessage (sign-message-request modal).
 *
 * signMessage (the gasless path) asks the wallet to sign an internal message WITHOUT
 * broadcasting it; the dApp would relay the returned `internalBoc` itself. Its payload shares
 * `SendTransactionRequest`'s shape and the modal renders a transaction-style preview
 * (`previewMode="sign"`), so — like the transaction spec — it emulates the message and the
 * sign path fetches the wallet seqno. We enable `mockWalletApi` (generous balance) so the
 * emulation + seqno mocks are installed and the preview settles.
 *
 * Flow: connect → `dapp.signMessage()` → `wallet.signMessage(confirm)` drives the per-type
 * `sign-message-request` modal (`sign-message-approve` / `sign-message-reject`). On approve the
 * dApp receives the signed internal-message BoC; on reject, a user-rejection error.
 */
const test = mockDappFixture({ mockWalletApi: { balanceNano: '100000000000' } });

test.describe('TON Connect mock-dApp — signMessage (two-tab)', () => {
    test('@allure.id=10130 Approving a signMessage request returns a signed internal BoC to the dApp', async ({
        wallet,
        dapp,
    }) => {
        const url = await dapp.connectUrl();
        await wallet.connectBy(url, false, true);
        await dapp.isConnected();

        await dapp.signMessage();
        // Assert the redesigned sign-message-request modal's copy + buttons before approving.
        await wallet.expectSignMessageModal();
        await wallet.signMessage(true);

        // Success carries the signed internal-message BoC (the wallet does NOT broadcast it).
        const result = await dapp.result();
        expect(result).toContain('internalBoc');
    });

    test('@allure.id=10132 Rejecting a signMessage request returns a user-rejection error to the dApp', async ({
        wallet,
        dapp,
    }) => {
        const url = await dapp.connectUrl();
        await wallet.connectBy(url, false, true);
        await dapp.isConnected();

        await dapp.signMessage();
        await wallet.expectSignMessageModal();
        await wallet.signMessage(false);

        const error = await dapp.error();
        expect(error.toLowerCase()).toMatch(/reject|declined|cancel/);
    });
});
