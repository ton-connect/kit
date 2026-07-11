/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { mockDappFixture } from '../ton-connect/mockDappFixture';

/**
 * Mock-first two-tab TON Connect — modal dismissibility guards.
 *
 * Two invariants of the redesigned wallet:
 *   - The TON Connect REQUEST modals (`connect-request` / `transaction-request` /
 *     `sign-message-request` / `sign-data-request`) are NON-dismissible: backdrop click / Esc must
 *     NOT close them — only Approve/Reject. They render via the shared DappRequestModal with
 *     `dismissible={false}` (modal.tsx wires `onEscapeKeyDown`/`onInteractOutside` → preventDefault).
 *   - The Connect-to-dApp PASTE modal (opened by `connect-dapp-button`; textarea `tonconnect-url`,
 *     action `tonconnect-process`) IS dismissible — Esc / backdrop close it (ConnectDappModal uses
 *     the default `dismissible` Modal.Container).
 *
 * We cover one connect-path request modal (`connect-request`) and one post-connect request modal
 * (`sign-data-request`), then the paste modal.
 */
const test = mockDappFixture();

test.describe('TON Connect mock-dApp — modal guards (two-tab)', () => {
    test('@allure.id=10173 The connect-request modal ignores Esc and backdrop (non-dismissible)', async ({
        wallet,
        dapp,
    }) => {
        const url = await dapp.connectUrl();
        // Bring the connect-request modal up without resolving it.
        await wallet.connectBy(url, /* shouldSkipConnect */ true);

        // Esc + backdrop must leave it visible.
        await wallet.expectRequestModalNotDismissible('connect-request');

        // Clean up: reject the still-open request.
        await wallet.connect(false);
    });

    test('@allure.id=10170 The sign-data-request modal ignores Esc and backdrop (non-dismissible)', async ({
        wallet,
        dapp,
    }) => {
        const url = await dapp.connectUrl();
        await wallet.connectBy(url, false, true);
        await dapp.isConnected();

        // Raise a sign-data request, then assert its modal is non-dismissible.
        await dapp.signData();
        await wallet.expectRequestModalNotDismissible('sign-data-request');

        // Clean up: reject the still-open request.
        await wallet.signData(false);
    });

    test('@allure.id=10171 The Connect-to-dApp paste modal IS dismissible (Esc closes it)', async ({ wallet }) => {
        // No dApp interaction needed — just open the wallet's own paste modal and Esc it shut.
        await wallet.expectPasteModalDismissibleByEsc();
    });
});
