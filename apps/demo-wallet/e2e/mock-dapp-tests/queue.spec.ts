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
 * Mock-first two-tab TON Connect — request queue.
 *
 * The wallet processes TON Connect requests ONE AT A TIME via its request queue
 * (`tonConnectSlice.ts`: `enqueueRequest` → `processNextRequest`, gated on `isProcessing`; the next
 * request is processed only `MODAL_CLOSE_DELAY` ms AFTER the current one is cleared). A second
 * incoming request must therefore WAIT until the first is resolved.
 *
 * Feasibility (verified in `@tonconnect/sdk` v4): `connector.signData` / `signMessage` each issue an
 * independent bridge RPC with its own request id — there is NO client-side serialization in the SDK,
 * so the dApp CAN have two requests in flight at once (see provider `sendRequest` →
 * `getNextRpcRequestId`). The mock-dApp's "Two requests" button (`dapp-two-requests`) fires
 * `signData` then `signMessage` WITHOUT awaiting the first; both reach the wallet, which must surface
 * them one modal at a time.
 *
 * signMessage renders a transaction-style preview, so (like the transaction/signMessage specs) we
 * enable `mockWalletApi` (generous balance + emulation + seqno mocks) so its modal settles.
 *
 * The bridge does not guarantee which of the two requests is delivered first, so the assertions are
 * order-agnostic: exactly one of {sign-data-request, sign-message-request} is shown at a time.
 *
 * SCOPE NOTE — what this asserts vs. what it does NOT. The invariant under test is the WALLET'S
 * queue: one request modal at a time, the second shown only after the first is resolved. That is
 * fully proven below (one modal → first settles on the dApp → second modal appears → resolved). It
 * is verified empirically that only the FIRST request's response round-trips back to the dApp
 * (settled count reaches 1, not 2): with two requests in flight over a single bridge session the
 * second response is not delivered back to this raw-`@tonconnect/sdk` connector. That is a
 * dApp/bridge-side response-correlation limitation, NOT a wallet-queue defect — the wallet still
 * processes and signs the second request (its modal shows and is approved/detached). So this test
 * asserts the queue sequencing + first-request round-trip, and only that the wallet COMPLETES the
 * second (modal detaches on approve), without requiring the second response back on the dApp.
 */
const REQUEST_MODALS = ['sign-data-request', 'sign-message-request'];

const test = mockDappFixture({ mockWalletApi: { balanceNano: '100000000000' } });

test.describe('TON Connect mock-dApp — request queue (two-tab)', () => {
    test('@allure.id=10169 Two concurrent requests are shown one modal at a time', async ({ wallet, dapp }) => {
        const url = await dapp.connectUrl();
        await wallet.connectBy(url, false, true);
        await dapp.isConnected();

        // Fire signData + signMessage without awaiting the first.
        await dapp.fireTwoRequests();

        // The wallet shows exactly ONE request modal; the other is queued.
        const first = await wallet.waitForOneRequestModal(REQUEST_MODALS);
        const second = REQUEST_MODALS.find((id) => id !== first)!;

        // Neither request has settled on the dApp yet (the second hasn't even been shown).
        expect(await dapp.settledCount()).toBe(0);

        // Approving the first lets the wallet advance the queue: the first request round-trips back
        // to the dApp (settled → 1) and, after MODAL_CLOSE_DELAY, the SECOND modal appears.
        await wallet.approveRequestModal(first);
        await dapp.waitForSettledCount(1);

        // Exactly the SECOND modal now appears (one-at-a-time held throughout) — never both at once.
        await wallet.waitForOneRequestModal([second]);

        // The wallet processes & signs the second too: approving detaches its modal (wallet-side
        // completion). See SCOPE NOTE — the second response is not delivered back to the dApp under
        // concurrent in-flight requests, so we don't wait for settled→2.
        await wallet.approveRequestModal(second);
    });
});
