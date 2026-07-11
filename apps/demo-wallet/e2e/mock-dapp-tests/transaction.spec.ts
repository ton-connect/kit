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
 * Mock-first two-tab TON Connect — sendTransaction (transaction-request modal).
 *
 * The wallet's `onTransactionRequest` silently rejects when balance < amount, so we install
 * the wallet-API mock with a generous balance (`mockWalletApi`) at the context level before
 * the wallet tab opens — otherwise the redesigned `transaction-request` modal would never
 * render. On-chain broadcast is suppressed by `VITE_DISABLE_NETWORK_SEND=true` (set in the
 * wallet dev server), so the wallet SIGNS the tx and returns the signed BoC to the dApp over
 * the bridge but spends ZERO funds.
 *
 * Flow: connect → `dapp.sendTransaction()` (tiny amount) → `wallet.accept(confirm)` drives the
 * per-type `transaction-request` modal (`send-transaction-approve` / `send-transaction-reject`).
 */
const test = mockDappFixture({ mockWalletApi: { balanceNano: '100000000000' } });

test.describe('TON Connect mock-dApp — sendTransaction (two-tab)', () => {
    test('@allure.id=10133 Approving a transaction returns a signed BoC to the dApp (no broadcast)', async ({
        wallet,
        dapp,
    }) => {
        const url = await dapp.connectUrl();
        await wallet.connectBy(url, false, true);
        await dapp.isConnected();

        await dapp.sendTransaction();
        // Assert the redesigned transaction-request modal's copy + buttons before approving.
        await wallet.expectTransactionModal();
        await wallet.accept(true);

        // Success carries the signed tx BoC (network send is disabled → nothing broadcast).
        const result = await dapp.result();
        expect(result).toContain('boc');
    });

    test('@allure.id=10136 Rejecting a transaction returns a user-rejection error to the dApp', async ({
        wallet,
        dapp,
    }) => {
        const url = await dapp.connectUrl();
        await wallet.connectBy(url, false, true);
        await dapp.isConnected();

        await dapp.sendTransaction();
        await wallet.expectTransactionModal();
        await wallet.accept(false);

        // The dApp's sendTransaction promise rejects with a user-declined error.
        const error = await dapp.error();
        expect(error.toLowerCase()).toMatch(/reject|declined|cancel/);
    });
});
