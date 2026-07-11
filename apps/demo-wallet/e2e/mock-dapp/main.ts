/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { TonConnect } from '@tonconnect/sdk';

/**
 * QA Mock dApp — the raw-`@tonconnect/sdk` driver tab for the two-tab demo-wallet
 * e2e suite. A TEST FIXTURE, not product code. It exposes the four TON Connect
 * request kinds (connect / sendTransaction / signData / signMessage) behind buttons
 * with stable test ids, and surfaces every result/error/connect-link into DOM
 * elements so the Playwright MockDapp page-object reads them directly — no modal
 * scraping, no clipboard.
 *
 * The connector talks to the demo-wallet over the SAME real TON Connect bridge the
 * wallet listens on (`https://connect.ton.org/bridge`): `connect()` returns a `tc://`
 * universal link, the test pastes it into the wallet's "Connect to dApp" flow, and
 * the handshake + every subsequent request ride that bridge.
 */

// The demo-wallet's bridge (see apps/demo-wallet/src/App.tsx → ENV_BRIDGE_URL).
const WALLET_BRIDGE_URL = 'https://connect.ton.org/bridge';

// Manifest is served from this same dir by vite (see tonconnect-manifest.json).
//
// NOTE on the host: the e2e serves this dApp on `127.0.0.1:5175` (NOT `localhost:5175`).
// WalletKit's `fetchManifest` runs `isValidHost(host)` on the manifest URL BEFORE fetching
// and requires the host to contain a dot (see packages/walletkit/src/utils/url.ts) — that
// guard is unconditional and is NOT bypassed by `disableManifestDomainCheck`. `localhost`
// has no dot and fails it ("App manifest not found"); `127.0.0.1` has dots and passes.
const MANIFEST_URL = `${window.location.origin}/tonconnect-manifest.json`;

// A well-formed mainnet address (Tether USDT master) used as the tx/signMessage target.
// We never broadcast (wallet runs with VITE_DISABLE_NETWORK_SEND=true), so any valid
// mainnet address is fine — the point is to render the redesigned transaction modal.
const TARGET_ADDRESS = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';

const connector = new TonConnect({ manifestUrl: MANIFEST_URL });

const $ = (id: string): HTMLElement => {
    const el = document.getElementById(id);
    if (!el) throw new Error(`[mock-dapp] missing element #${id}`);
    return el;
};

const setResult = (value: unknown): void => {
    $('dapp-result').textContent = typeof value === 'string' ? value : JSON.stringify(value);
};

const setError = (err: unknown): void => {
    $('dapp-error').textContent = err instanceof Error ? err.message : String(err);
};

const clearOutputs = (): void => {
    $('dapp-result').textContent = '';
    $('dapp-error').textContent = '';
};

// Reflect connection status into #dapp-connected so the test can poll it. The 2nd arg is
// the connect error handler: a wallet-side connect REJECTION arrives here (not via a thrown
// promise — `connector.connect()` only returns the universal link). Surface it into
// #dapp-error so the test has a real terminal signal that the rejection round-tripped.
connector.onStatusChange(
    (wallet) => {
        $('dapp-connected').textContent = wallet ? 'true' : '';
        // Expose the connected account for debugging / optional assertions.
        (window as unknown as { __dappWallet?: unknown }).__dappWallet = wallet;
    },
    (err) => {
        setError(err);
    },
);

$('dapp-connect').addEventListener('click', () => {
    clearOutputs();
    $('dapp-connect-url').textContent = '';
    try {
        // External (HTTP-bridge) wallet source → connect() returns a universal link string.
        const url = connector.connect({ bridgeUrl: WALLET_BRIDGE_URL, universalLink: 'tc://' });
        const link = String(url);
        $('dapp-connect-url').textContent = link;
        (window as unknown as { __dappConnectUrl?: string }).__dappConnectUrl = link;
    } catch (err) {
        setError(err);
    }
});

$('dapp-send-tx').addEventListener('click', async () => {
    clearOutputs();
    try {
        const res = await connector.sendTransaction({
            validUntil: Math.floor(Date.now() / 1000) + 600,
            // 0.000001 TON — tiny; never broadcast (network send disabled in the wallet).
            messages: [{ address: TARGET_ADDRESS, amount: '1000' }],
        });
        // Success carries the signed tx BoC.
        setResult({ boc: res.boc });
    } catch (err) {
        setError(err);
    }
});

$('dapp-sign-data').addEventListener('click', async () => {
    clearOutputs();
    try {
        const res = await connector.signData({ type: 'text', text: 'QA mock dApp sign-data payload' });
        setResult({ signature: res.signature, address: res.address });
    } catch (err) {
        setError(err);
    }
});

$('dapp-sign-message').addEventListener('click', async () => {
    clearOutputs();
    try {
        // signMessage shares SendTransactionRequest's shape; the wallet signs WITHOUT broadcasting.
        const res = await connector.signMessage({
            validUntil: Math.floor(Date.now() / 1000) + 600,
            messages: [{ address: TARGET_ADDRESS, amount: '1000' }],
        });
        setResult({ internalBoc: res.internalBoc });
    } catch (err) {
        setError(err);
    }
});

// Fire TWO requests back-to-back WITHOUT awaiting the first (signData, then signMessage). Each
// `connector.<method>()` issues an independent bridge RPC with its own request id (no client-side
// serialization in @tonconnect/sdk), so both reach the wallet, which must then surface them ONE AT
// A TIME via its request queue. We track how many have SETTLED (resolved or rejected) into
// #dapp-settled-count so the queue test can assert the second only settles after the first is
// resolved in the wallet. Outputs are intentionally NOT cleared between the two (the test reads the
// modal sequencing on the wallet side, not the dApp result text).
$('dapp-two-requests').addEventListener('click', () => {
    clearOutputs();
    $('dapp-settled-count').textContent = '0';
    let settled = 0;
    const markSettled = (): void => {
        settled += 1;
        $('dapp-settled-count').textContent = String(settled);
    };
    // First request: signData (no balance guard, simplest modal).
    void connector
        .signData({ type: 'text', text: 'QA queue request #1 (signData)' })
        .catch(() => {})
        .finally(markSettled);
    // Second request: signMessage. Issued synchronously right after, before #1 is resolved.
    void connector
        .signMessage({
            validUntil: Math.floor(Date.now() / 1000) + 600,
            messages: [{ address: TARGET_ADDRESS, amount: '1000' }],
        })
        .catch(() => {})
        .finally(markSettled);
});
