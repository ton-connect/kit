/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Page, Route } from '@playwright/test';

/**
 * Route mocks for the TonAPI gasless relayer endpoints, installed on the
 * **minter** page. All three gasless calls (`/v2/gasless/{config,estimate,send}`)
 * originate from the dApp side, so `page.route()` on the minter page intercepts
 * them — the wallet tab is never touched.
 *
 * The point of mocking `/send` is twofold:
 *   1. nothing is broadcast on-chain, so the gate spends no funds, and
 *   2. the captured request body lets a test assert the minter formed the gasless
 *      message correctly — i.e. tx-formation is verified without a real send.
 *
 * `/estimate` mocks drive the relayer-error rendering paths deterministically
 * (HTTP 400/500, malformed body, expired quote) instead of relying on a live
 * relayer to misbehave.
 */

const CONFIG_RE = /\/v2\/gasless\/config/;
const ESTIMATE_RE = /\/v2\/gasless\/estimate\//;
const SEND_RE = /\/v2\/gasless\/send/;

/** Real mainnet USDT (Tether) master — a valid friendly address the mappers accept. */
export const USDT_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';

const json = (route: Route, status: number, body: unknown) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

interface ConfigOpts {
    /** Fee-asset master addresses the relayer "accepts". Defaults to USDT. */
    assets?: string[];
    relayAddress?: string;
    /** Artificial latency before responding — lets a test observe the loading state. */
    delayMs?: number;
}

/** Mock `GET /v2/gasless/config` with a valid relay address + supported assets. */
export async function mockGaslessConfig(page: Page, opts: ConfigOpts = {}): Promise<void> {
    const assets = opts.assets ?? [USDT_MASTER];
    await page.route(CONFIG_RE, async (route) => {
        if (opts.delayMs) await sleep(opts.delayMs);
        return json(route, 200, {
            relay_address: opts.relayAddress ?? USDT_MASTER,
            gas_jettons: assets.map((master_id) => ({ master_id })),
        });
    });
}

interface EstimateOkOpts {
    /** Relayer commission in raw fee-asset units (e.g. "219000" → 0.219 USDT @ 6 decimals). */
    commission?: string;
    /**
     * Echoed `from`. Defaults to the `wallet_address` of the incoming estimate
     * request, so the quote always belongs to the connected wallet and clears the
     * WALLET_MISMATCH guard. Pass an explicit (different) address to *trigger* that
     * guard
     */
    from?: string;
    /** Seconds-from-now the quote stays valid. Negative ⇒ already expired. */
    validForSeconds?: number;
    relayAddress?: string;
    /** If provided, each estimate request URL is pushed here — lets a test prove a re-quote fired. */
    capture?: string[];
    /** Artificial latency before responding — lets a test observe "Quoting…" / the fee skeleton. */
    delayMs?: number;
}

/** Mock `POST /v2/gasless/estimate/{master}` with a successful quote. */
export async function mockGaslessEstimateOk(page: Page, opts: EstimateOkOpts = {}): Promise<void> {
    await page.route(ESTIMATE_RE, async (route) => {
        opts.capture?.push(route.request().url());
        if (opts.delayMs) await sleep(opts.delayMs);
        let from = opts.from;
        if (!from) {
            // Echo the wallet the dApp quoted for — raw `0:` form, which the address
            // mappers normalize the same as the wallet's friendly address.
            try {
                from = JSON.parse(route.request().postData() ?? '{}').wallet_address;
            } catch {
                /* fall through to USDT_MASTER */
            }
        }
        const validUntil = Math.floor(Date.now() / 1000) + (opts.validForSeconds ?? 300);
        return json(route, 200, {
            relay_address: opts.relayAddress ?? USDT_MASTER,
            commission: opts.commission ?? '219000',
            from: from ?? USDT_MASTER,
            valid_until: validUntil,
            // payload/state_init are optional in the wire schema; omitting them
            // keeps the mock valid without hand-crafting BoC hex.
            messages: [{ address: USDT_MASTER, amount: '100000000' }],
        });
    });
}

interface EstimateErrorOpts {
    status?: number;
    /** Relayer error body. Mirrors the shape TonAPI returns (kept for realism). */
    body?: unknown;
    /** Return a 200 with a non-JSON body to exercise the "Unexpected non-JSON" path. */
    nonJson?: boolean;
}

/** Mock `POST /v2/gasless/estimate/{master}` with a relayer error. */
export async function mockGaslessEstimateError(page: Page, opts: EstimateErrorOpts = {}): Promise<void> {
    await page.route(ESTIMATE_RE, (route) => {
        if (opts.nonJson) {
            return route.fulfill({ status: 200, contentType: 'text/html', body: '<html>gateway timeout</html>' });
        }
        return json(route, opts.status ?? 400, opts.body ?? { error: 'Jetton is not supported.', error_code: 40000 });
    });
}

export interface SendCapture {
    /** Bodies of every `POST /v2/gasless/send` the minter issued, in order. */
    requests: Array<{ wallet_public_key?: string; boc?: string }>;
}

interface SendOkOpts {
    capture?: SendCapture;
    protocolName?: string;
}

/**
 * Mock `POST /v2/gasless/send` with a relayer ACK — nothing is broadcast. When a
 * `capture` is passed, every request body is recorded so the test can assert the
 * minter formed a well-shaped send (public key + non-empty BoC) — tx-formation
 * coverage without an on-chain send.
 *
 * NB: the body omits `external`, so `mapGaslessSend` raises (it requires the
 * broadcast external-message BoC). That is fine for the capture-based tests here
 * (they assert the outbound request, not a post-send receipt). A future test that
 * needs the success *receipt* must return a real external-in BoC hex in `external`
 * — or use a `@real-send` test.
 */
export async function mockGaslessSendOk(page: Page, opts: SendOkOpts = {}): Promise<void> {
    await page.route(SEND_RE, (route) => {
        if (opts.capture) {
            try {
                opts.capture.requests.push(JSON.parse(route.request().postData() ?? '{}'));
            } catch {
                opts.capture.requests.push({});
            }
        }
        return json(route, 200, { protocol_name: opts.protocolName ?? 'tonapi' });
    });
}

interface SendErrorOpts {
    status?: number;
    body?: unknown;
    capture?: SendCapture;
}

/** Mock `POST /v2/gasless/send` with a relayer error. */
export async function mockGaslessSendError(page: Page, opts: SendErrorOpts = {}): Promise<void> {
    await page.route(SEND_RE, (route) => {
        if (opts.capture) {
            try {
                opts.capture.requests.push(JSON.parse(route.request().postData() ?? '{}'));
            } catch {
                opts.capture.requests.push({});
            }
        }
        return json(route, opts.status ?? 500, opts.body ?? { error: 'relayer unavailable' });
    });
}

/**
 * Mock `POST /v2/gasless/send` with a per-call status sequence — e.g. `[503, 200]`
 * makes the first send fail transiently and the retry succeed. Statuses
 * beyond the list reuse the last one. 2xx returns a success body; others an error.
 */
export async function mockGaslessSendSequence(page: Page, statuses: number[], capture?: SendCapture): Promise<void> {
    let call = 0;
    await page.route(SEND_RE, (route) => {
        const status = statuses[Math.min(call, statuses.length - 1)] ?? 200;
        call += 1;
        if (capture) {
            try {
                capture.requests.push(JSON.parse(route.request().postData() ?? '{}'));
            } catch {
                capture.requests.push({});
            }
        }
        const ok = status >= 200 && status < 300;
        return json(route, status, ok ? { protocol_name: 'tonapi' } : { error: 'transient relayer error' });
    });
}
