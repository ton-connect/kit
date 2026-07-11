/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Page, Route } from '@playwright/test';

/**
 * Route mocks for the wallet's data backend, installed on the **demo-wallet** page.
 *
 * The demo-wallet's default API provider is Toncenter (see `ENV_TON_API_PROVIDER`
 * in `src/core/lib/env.ts` — only `VITE_TON_API_PROVIDER=tonapi` switches it to
 * TonAPI, which CI does not set). So the dashboard's balance / jettons / NFTs /
 * history all originate from `*.toncenter.com/api/v3/*` calls made by WalletKit's
 * `ApiClientToncenter`, plus a market-rates call to `api.dyor.io`.
 *
 * Mocking these lets the dashboard render deterministically WITHOUT a real funded
 * wallet — the dashboard gates its total/asset rows on `balance !== undefined`,
 * `lastJettonsUpdate > 0` and `ratesUpdated > 0` (see `use-asset-rows.ts` and
 * `balance-total.tsx`), all three of which these mocks satisfy.
 *
 * Endpoints matched (by path regex, address-agnostic):
 *   - GET  /api/v3/addressInformation   → native balance (account state)
 *   - GET  /api/v3/jetton/wallets        → user jettons (USDT + one more)
 *   - GET  /api/v3/jetton/masters        → default-token metadata (USDT/XAUT padding)
 *   - GET  /api/v3/nft/items             → owned NFTs (with working preview images)
 *   - GET  /api/v3/traces                → history events
 *   - GET  api.dyor.io/v1/jettons        → market rates (GRAM + jettons), so fiat renders
 *
 * Mirrors the style of `apps/appkit-minter/e2e/mocks/gaslessRelayer.ts`.
 */

const ADDRESS_INFO_RE = /\/api\/v3\/addressInformation/;
const JETTON_WALLETS_RE = /\/api\/v3\/jetton\/wallets/;
const JETTON_MASTERS_RE = /\/api\/v3\/jetton\/masters/;
const NFT_ITEMS_RE = /\/api\/v3\/nft\/items/;
const TRACES_RE = /\/api\/v3\/traces/;
const RATES_RE = /api\.dyor\.io\/v1\/jettons/;
const EMULATE_RE = /\/api\/emulate\/v1\/emulateTrace/;
const RUN_GET_METHOD_RE = /\/api\/v3\/runGetMethod/;

/** Real mainnet USDT (Tether) master — Toncenter's `mapToResponseUserJettons` marks this verified. */
export const USDT_MASTER_RAW = '0:B113A994B5024A16719F69139328EB759596C38A25F59028B146FECDC3621DFE';
export const USDT_MASTER_FRIENDLY = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
/** Tether Gold (XAUT) master — the demo-wallet's second default-padding token. */
export const XAUT_MASTER_RAW = '0:0E41DC1DC3C9067F9C7C38C49E72CA9097B543C7F7F5BA0E2D11C7B0EE04EC04';
export const XAUT_MASTER_FRIENDLY = 'EQA1R_LuQCLHlMgOo1S4G7Y7W1cd0FrAkbA10Zq7rddKxi9k';
/** All-zero master — the address DYOR returns TON/GRAM rates under. */
const RAW_GRAM_ADDRESS = '0:0000000000000000000000000000000000000000000000000000000000000000';

/**
 * A 1×1 transparent PNG as a data: URI — used for jetton/NFT preview images so
 * `<img>`/`<FallbackImage>` load successfully under the strict offline test env
 * (no external image hosts are reachable / mocked).
 */
const PLACEHOLDER_IMG =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQAY3Z2VAAAAAElFTkSuQmCC';

const json = (route: Route, status: number, body: unknown): Promise<void> =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

/** A jetton holding the mock wallet "owns" — raw master, raw amount, symbol/name/decimals. */
export interface MockJetton {
    /** Raw (`0:`-prefixed, upper-hex) jetton-master address. */
    masterRaw: string;
    /** Raw token amount (smallest units), as a decimal string. */
    balance: string;
    symbol: string;
    name: string;
    decimals: number;
    /** Image URL stored in metadata; defaults to an inline placeholder so it always loads. */
    image?: string;
}

/** A market rate keyed by raw jetton-master address (`RAW_GRAM_ADDRESS` ⇒ TON/GRAM). */
export interface MockRate {
    masterRaw: string;
    /** Price in USD. */
    priceUsd: number;
}

/** An NFT the mock wallet "owns" — raw item address, index, name + preview image. */
export interface MockNft {
    /** Raw (`0:`-prefixed) NFT-item address. */
    itemRaw: string;
    index: string;
    name: string;
    /** Preview image URL; defaults to an inline placeholder so it always loads. */
    image?: string;
}

/**
 * A single history event the mock wallet "sent" or "received".
 *
 * The demo-wallet's history is driven by WalletKit's `getEvents` → `/api/v3/traces`,
 * which runs each trace through `toEvent` (packages/walletkit `AccountEvent.ts`). For a
 * native GRAM transfer to surface as a "Sent/Received N GRAM" row, the trace's single
 * transaction MUST have `tx.account === <our wallet address>` and a matching `out_msgs`
 * (sent) / `in_msg` (received) carrying the `value`. The wallet address is generated
 * fresh per test, so {@link tracesBody} reads it from the `account` query param that
 * `getEvents` puts on the `/api/v3/traces` request and stamps it into the trace.
 */
export interface MockEvent {
    /** Base64 trace id (becomes `eventId` via `Base64ToHex`, and the row subtitle). */
    traceId: string;
    /** `sent` → an outgoing `out_msgs` transfer; `received` → an incoming `in_msg` transfer. */
    direction: 'sent' | 'received';
    /** Transfer amount in raw nanotons (decimal string). */
    amountNano: string;
    /** Counterparty (recipient for `sent`, sender for `received`). Defaults to a constant peer. */
    peerRaw?: string;
    /** When `true`, the trace's transaction is marked aborted → the row shows a "failed" badge. */
    failed?: boolean;
    /** Unix seconds for the row date; defaults to a fixed timestamp so the row renders deterministically. */
    timestamp?: number;
}

export interface MockWalletApiOpts {
    /** Native TON/GRAM balance in raw nanotons (decimal string). Default `12_500_000_000` (12.5 GRAM). */
    balanceNano?: string;
    /** Jettons the wallet holds. Default: USDT + XAUT, both with a small balance. */
    jettons?: MockJetton[];
    /** NFTs the wallet holds. Default: 2 NFTs with placeholder previews. */
    nfts?: MockNft[];
    /** History events. Default: one sent + one received GRAM transfer, so ≥1 history row renders. */
    events?: MockEvent[];
    /** Market rates. Default: GRAM ≈ $5.20, USDT ≈ $1, XAUT ≈ $2400. */
    rates?: MockRate[];
}

const DEFAULT_JETTONS: MockJetton[] = [
    { masterRaw: USDT_MASTER_RAW, balance: '42500000', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { masterRaw: XAUT_MASTER_RAW, balance: '1500000', symbol: 'XAUT', name: 'Tether Gold', decimals: 6 },
];

const DEFAULT_NFTS: MockNft[] = [
    { itemRaw: '0:1111111111111111111111111111111111111111111111111111111111111111', index: '1', name: 'Test NFT One' },
    { itemRaw: '0:2222222222222222222222222222222222222222222222222222222222222222', index: '2', name: 'Test NFT Two' },
];

const DEFAULT_RATES: MockRate[] = [
    { masterRaw: RAW_GRAM_ADDRESS, priceUsd: 5.2 },
    { masterRaw: USDT_MASTER_RAW, priceUsd: 1.0 },
    { masterRaw: XAUT_MASTER_RAW, priceUsd: 2400.0 },
];

/** Valid 32-byte base64 trace ids (Base64ToHex decodes these into the row eventId/subtitle). */
const SENT_TRACE_ID = 'AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=';
const RECEIVED_TRACE_ID = 'AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI=';

/** Default history: one outgoing 5 GRAM transfer + one incoming 2.5 GRAM transfer. */
const DEFAULT_EVENTS: MockEvent[] = [
    { traceId: SENT_TRACE_ID, direction: 'sent', amountNano: '5000000000', timestamp: 1_700_000_100 },
    { traceId: RECEIVED_TRACE_ID, direction: 'received', amountNano: '2500000000', timestamp: 1_700_000_000 },
];

/** Build the Toncenter `/api/v3/addressInformation` body for an active account. */
function addressInformationBody(balanceNano: string): unknown {
    return {
        balance: balanceNano,
        status: 'active',
        // Toncenter's getAccountState iterates this as an array of {id, amount} — must NOT be an object.
        extra_currencies: [],
        code: null,
        data: null,
        // The all-zero hash sentinel — Toncenter's parseInternalTransactionId returns null for it
        // (a `null` here would make Base64ToHex throw "Invalid hash: data is required").
        last_transaction_hash: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        last_transaction_lt: '0',
        frozen_hash: null,
    };
}

/** Build the Toncenter `/api/v3/jetton/wallets` body (wallets + metadata) for the held jettons. */
function jettonWalletsBody(jettons: MockJetton[]): unknown {
    const jetton_wallets = jettons.map((j, i) => ({
        // A synthetic but unique jetton-wallet address per holding.
        address: `0:${(i + 3).toString().padStart(64, '0')}`,
        balance: j.balance,
        owner: '0:0000000000000000000000000000000000000000000000000000000000000001',
        jetton: j.masterRaw,
        last_transaction_lt: '0',
        code_hash: '',
        data_hash: '',
    }));

    const metadata: Record<string, unknown> = {};
    for (const j of jettons) {
        metadata[j.masterRaw] = {
            is_indexed: true,
            token_info: [
                {
                    valid: true,
                    type: 'jetton_masters',
                    name: j.name,
                    symbol: j.symbol,
                    description: `${j.name} mock token`,
                    image: j.image ?? PLACEHOLDER_IMG,
                    extra: {
                        decimals: String(j.decimals),
                        image_data: undefined,
                    },
                },
            ],
        };
    }

    return { jetton_wallets, address_book: {}, metadata };
}

/** Build the Toncenter `/api/v3/jetton/masters` body for a default-token metadata lookup. */
function jettonMastersBody(jettons: MockJetton[]): unknown {
    const jetton_masters = jettons.map((j, i) => ({
        address: j.masterRaw,
        balance: '0',
        owner: '0:0000000000000000000000000000000000000000000000000000000000000000',
        jetton: j.masterRaw,
        last_transaction_lt: String(i),
        code_hash: '',
        data_hash: '',
    }));

    const metadata: Record<string, unknown> = {};
    for (const j of jettons) {
        metadata[j.masterRaw] = {
            is_indexed: true,
            token_info: [
                {
                    valid: true,
                    type: 'jetton_masters',
                    name: j.name,
                    symbol: j.symbol,
                    description: `${j.name} mock token`,
                    image: j.image ?? PLACEHOLDER_IMG,
                    extra: { decimals: String(j.decimals) },
                },
            ],
        };
    }

    return { jetton_masters, address_book: {}, metadata };
}

/** Build the Toncenter `/api/v3/nft/items` body (items + per-item metadata with a preview image). */
function nftItemsBody(nfts: MockNft[]): unknown {
    const nft_items = nfts.map((n) => ({
        address: n.itemRaw,
        auction_contract_address: '',
        collection: null,
        collection_address: null,
        content: { uri: '' },
        index: n.index,
        init: true,
        is_sbt: false,
        last_transaction_lt: '0',
        on_sale: false,
        owner_address: '0:0000000000000000000000000000000000000000000000000000000000000001',
        real_owner: '0:0000000000000000000000000000000000000000000000000000000000000001',
        sale_contract_address: '',
    }));

    const metadata: Record<string, unknown> = {};
    for (const n of nfts) {
        metadata[n.itemRaw] = {
            is_indexed: true,
            token_info: [
                {
                    valid: true,
                    type: 'nft_items',
                    name: n.name,
                    description: `${n.name} mock NFT`,
                    image: n.image ?? PLACEHOLDER_IMG,
                    extra: {
                        _image_small: n.image ?? PLACEHOLDER_IMG,
                        _image_medium: n.image ?? PLACEHOLDER_IMG,
                        _image_big: n.image ?? PLACEHOLDER_IMG,
                    },
                },
            ],
        };
    }

    return { nft_items, address_book: {}, metadata };
}

/** A constant counterparty address used when a `MockEvent` doesn't name its own peer. */
const PEER_RAW = '0:00000000000000000000000000000000000000000000000000000000000000AA';

/**
 * Build ONE Toncenter transaction shaped so WalletKit's `toEvent` emits a single
 * native-GRAM transfer action for `accountRaw` (the wallet's own address). Mirrors the
 * minimal-but-valid transaction used by WalletKit's own `makeTx` test fixture
 * (`packages/walletkit/.../testFixtures.ts`): the `description.{aborted,compute_ph.success,
 * action.success}` triple is what `computeStatus` reads to mark success/failure.
 */
function transferTransaction(accountRaw: string, e: MockEvent): unknown {
    const failed = e.failed ?? false;
    const peer = e.peerRaw ?? PEER_RAW;
    const now = e.timestamp ?? 1_700_000_000;
    const transferMsg = {
        hash: `${e.traceId}-msg`,
        hash_norm: `${e.traceId}-msg`,
        source: e.direction === 'sent' ? accountRaw : peer,
        destination: e.direction === 'sent' ? peer : accountRaw,
        value: e.amountNano,
        value_extra_currencies: {},
        fwd_fee: '0',
        ihr_fee: '0',
        created_lt: '0',
        created_at: String(now),
        opcode: null,
        ihr_disabled: null,
        bounce: false,
        bounced: false,
        import_fee: null,
        message_content: { hash: 'h', body: '', decoded: null },
        init_state: null,
    };
    return {
        account: accountRaw,
        hash: e.traceId,
        lt: '0',
        now,
        mc_block_seqno: 0,
        trace_external_hash: 'ext',
        prev_trans_hash: null,
        prev_trans_lt: null,
        orig_status: 'active',
        end_status: 'active',
        total_fees: '0',
        total_fees_extra_currencies: {},
        block_ref: { workchain: 0, shard: '0', seqno: 0 },
        // `sent` carries the transfer on out_msgs; `received` on in_msg (credit_ph marks it succeeded).
        in_msg:
            e.direction === 'received'
                ? transferMsg
                : { ...transferMsg, value: null, source: peer, destination: accountRaw },
        out_msgs: e.direction === 'sent' ? [transferMsg] : [],
        account_state_before: {
            hash: 'h',
            balance: '0',
            extra_currencies: null,
            account_status: 'active',
            frozen_hash: null,
            data_hash: null,
            code_hash: null,
        },
        account_state_after: {
            hash: 'h',
            balance: '0',
            extra_currencies: null,
            account_status: 'active',
            frozen_hash: null,
            data_hash: null,
            code_hash: null,
        },
        emulated: false,
        description: {
            type: 'ord',
            aborted: failed,
            destroyed: false,
            credit_first: false,
            is_tock: false,
            installed: false,
            storage_ph: { storage_fees_collected: '0', status_change: 'unchanged' },
            credit_ph: e.direction === 'received' ? { credit: e.amountNano } : undefined,
            compute_ph: {
                skipped: false,
                success: !failed,
                msg_state_used: false,
                account_activated: false,
                gas_fees: '0',
                gas_used: '0',
                gas_limit: '0',
                mode: 0,
                exit_code: failed ? 1 : 0,
                vm_steps: 0,
                vm_init_state_hash: '',
                vm_final_state_hash: '',
            },
            action: {
                success: !failed,
                valid: true,
                no_funds: false,
                status_change: 'unchanged',
                result_code: 0,
                tot_actions: failed ? 0 : 1,
                spec_actions: 0,
                skipped_actions: 0,
                msgs_created: failed ? 0 : 1,
                action_list_hash: '',
                tot_msg_size: { cells: '0', bits: '0' },
            },
        },
    };
}

/**
 * Build the Toncenter `/api/v3/traces` body for the history section.
 *
 * `accountRaw` is the wallet's own address (read from the request's `account` query
 * param) — `toEvent` only emits transfer actions for transactions whose `account`
 * matches the queried account, so the trace's tx must be stamped with it.
 */
function tracesBody(events: MockEvent[], accountRaw: string | null): unknown {
    if (!accountRaw) {
        // No account on the request (shouldn't happen via getEvents) — empty, no rows.
        return { traces: [], address_book: {}, metadata: {} };
    }
    return {
        traces: events.map((e) => ({
            trace_id: e.traceId,
            external_hash: 'ext',
            mc_seqno_start: '0',
            mc_seqno_end: '0',
            start_lt: '0',
            start_utime: e.timestamp ?? 1_700_000_000,
            end_lt: '0',
            end_utime: e.timestamp ?? 1_700_000_000,
            trace_info: {
                classification_state: 'ok',
                messages: 1,
                pending_messages: 0,
                trace_state: 'complete',
                transactions: 1,
            },
            is_incomplete: false,
            trace: { tx_hash: e.traceId, in_msg_hash: null, children: [] },
            transactions_order: [e.traceId],
            transactions: { [e.traceId]: transferTransaction(accountRaw, e) },
            actions: [],
            warning: '',
        })),
        address_book: {},
        metadata: {},
    };
}

/** Build the DYOR `/v1/jettons` body — `priceUsd` as a `{value, decimals}` money object. */
function ratesBody(rates: MockRate[]): unknown {
    return {
        jettons: rates.map((r) => ({
            metadata: { address: r.masterRaw },
            // 9-decimal money object: priceUsd = value / 10^decimals.
            priceUsd: { value: String(Math.round(r.priceUsd * 1e9)), decimals: 9 },
        })),
    };
}

/**
 * Install all wallet-API route mocks on `page`. MUST be called BEFORE the page
 * navigates to (or reloads into) the dashboard, so the route handlers are in place
 * before WalletKit fires its first balance/jettons/rates fetch.
 */
export async function mockWalletApi(page: Page, opts: MockWalletApiOpts = {}): Promise<void> {
    const balanceNano = opts.balanceNano ?? '12500000000';
    const jettons = opts.jettons ?? DEFAULT_JETTONS;
    const nfts = opts.nfts ?? DEFAULT_NFTS;
    const events = opts.events ?? DEFAULT_EVENTS;
    const rates = opts.rates ?? DEFAULT_RATES;

    await page.route(ADDRESS_INFO_RE, (route) => json(route, 200, addressInformationBody(balanceNano)));
    await page.route(JETTON_WALLETS_RE, (route) => json(route, 200, jettonWalletsBody(jettons)));
    await page.route(JETTON_MASTERS_RE, (route) => json(route, 200, jettonMastersBody(jettons)));
    await page.route(NFT_ITEMS_RE, (route) => json(route, 200, nftItemsBody(nfts)));
    await page.route(TRACES_RE, (route) => {
        // `getEvents` queries /api/v3/traces?account=<friendly>&limit=&offset= — the trace's tx
        // must be stamped with this account or `toEvent` emits no transfer actions (no rows).
        // Honour the `limit`/`offset` window so a paginated "Load more" fetch advances through
        // the events instead of re-receiving the full list every time (which would loop forever,
        // since `hasNext` is `traces.length >= limit`). Defaults mirror ApiClientToncenter.getEvents
        // (`limit` 20, `offset` 0).
        const params = new URL(route.request().url()).searchParams;
        const account = params.get('account');
        const limit = Number.parseInt(params.get('limit') ?? '', 10);
        const offset = Number.parseInt(params.get('offset') ?? '', 10);
        const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 20;
        const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;
        const page = events.slice(safeOffset, safeOffset + safeLimit);
        return json(route, 200, tracesBody(page, account));
    });
    await page.route(RATES_RE, (route) => json(route, 200, ratesBody(rates)));
}

/** Install only the rates mock — handy when a test cares about fiat but not assets. */
export async function mockRates(page: Page, rates: MockRate[] = DEFAULT_RATES): Promise<void> {
    await page.route(RATES_RE, (route) => json(route, 200, ratesBody(rates)));
}

/**
 * A minimal, well-formed Toncenter `emulateTrace` success body.
 *
 * The redesigned transaction-request modal emulates the pending transfer to build its
 * preview (WalletKit's `getTransactionPreview` → `fetchEmulation`, double-wrapped in
 * `CallForSuccess(20×100ms)`). Against the real toncenter the synthetic test transfer 500s,
 * so those retries storm for ~40s+ and the modal never settles → approve never completes.
 * This body resolves the emulation on the FIRST call. `mapToncenterEmulationResponse` only
 * dereferences `trace.tx_hash` + `rand_seed` (via `Base64ToHex`, so both must be valid
 * base64); `transactions`/`address_book`/`code_cells`/`data_cells` default to `{}`, so no
 * per-transaction fields are required — the preview renders with no decoded transfers, which
 * is fine for an e2e that only asserts the modal shows and approval returns a signed BoC.
 */
const EMULATION_HASH_B64 = 'AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=';

function emulateTraceBody(): unknown {
    return {
        mc_block_seqno: 0,
        trace: { tx_hash: EMULATION_HASH_B64, in_msg_hash: null, children: [] },
        transactions: {},
        actions: [],
        rand_seed: EMULATION_HASH_B64,
        is_incomplete: false,
        code_cells: {},
        data_cells: {},
        address_book: {},
    };
}

/**
 * Install the emulation mock on `page` so the transaction-request preview resolves instantly
 * instead of storming the real toncenter `emulateTrace` (which 500s on a synthetic transfer).
 */
export async function mockEmulation(page: Page): Promise<void> {
    await page.route(EMULATE_RE, (route) => json(route, 200, emulateTraceBody()));
}

/**
 * Mock the wallet-contract `seqno` get-method (`/api/v3/runGetMethod`) so signing is
 * deterministic and offline. Returns `exit_code: 0` with a single numeric stack entry
 * (`seqno = 0`) — the value the wallet uses to build the transfer body. Without it, signing
 * falls back to the real toncenter (5×1s `getSeqno` retries against an undeployed test wallet).
 */
export async function mockRunGetMethod(page: Page, seqno = 0): Promise<void> {
    await page.route(RUN_GET_METHOD_RE, (route) =>
        json(route, 200, {
            gas_used: 0,
            exit_code: 0,
            stack: [{ type: 'num', value: `0x${seqno.toString(16)}` }],
        }),
    );
}
