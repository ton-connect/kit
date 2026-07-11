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
 * Mock-first two-tab TON Connect — signData (sign-data-request modal).
 *
 * signData carries no value transfer and no balance guard, so no wallet-API mock is needed.
 * Flow: connect → `dapp.signData()` (text payload) → `wallet.signData(confirm)` drives the
 * per-type `sign-data-request` modal (`sign-data-approve` / `sign-data-reject`). On approve the
 * dApp receives an Ed25519 signature + signer address; on reject, a user-rejection error.
 */
const test = mockDappFixture();

test.describe('TON Connect mock-dApp — signData (two-tab)', () => {
    test('@allure.id=10129 Approving a signData request returns a signature to the dApp', async ({ wallet, dapp }) => {
        const url = await dapp.connectUrl();
        await wallet.connectBy(url, false, true);
        await dapp.isConnected();

        await dapp.signData();
        // Assert the redesigned sign-data-request modal's copy + buttons before approving.
        await wallet.expectSignDataModal();
        await wallet.signData(true);

        const result = await dapp.result();
        expect(result).toContain('signature');
    });

    test('@allure.id=10134 Rejecting a signData request returns a user-rejection error to the dApp', async ({
        wallet,
        dapp,
    }) => {
        const url = await dapp.connectUrl();
        await wallet.connectBy(url, false, true);
        await dapp.isConnected();

        await dapp.signData();
        await wallet.expectSignDataModal();
        await wallet.signData(false);

        const error = await dapp.error();
        expect(error.toLowerCase()).toMatch(/reject|declined|cancel/);
    });
});
