/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Address, Dictionary } from '@ton/core';

/**
 * On-chain wire shape of the limits, recovered from a ChangeNftContentMsg body:
 * `map<address, map<uint32, coins>>` = {asset: {window_seconds: max_spend}}.
 *
 * - Outer key: the asset address. TON is the sentinel zero address; jettons use
 *   their jetton-master address.
 * - Inner key: rolling window in seconds. The special value `0` is a
 *   per-transaction limit.
 * - Inner value: maximum spend in the asset's base units.
 */
export type LimitsDict = Dictionary<Address, Dictionary<number, bigint>>;

/**
 * A single outgoing-spend observation derived from on-chain history, already
 * netted per asset. Amounts are strictly positive base units.
 */
export interface SpendEntry {
    /** Unix timestamp in seconds. */
    timestamp: number;
    /** Normalized asset key: `'TON'` or a normalized jetton-master address. */
    asset: string;
    /** Spent amount in the asset's base units (always > 0). */
    amount: bigint;
}

/**
 * A single outgoing jetton transfer recovered from a transaction's out-messages,
 * before its jetton-wallet address is resolved to a master. Resolution
 * (`resolveJettonProbes`) is an in-memory lookup against the cached forward jetton
 * map — no `get_wallet_data` call — keeping the transaction parser pure and
 * synchronous and the history scan RPC-free beyond transaction paging.
 */
export interface JettonSpendProbe {
    /** Unix timestamp in seconds of the transaction that emitted the transfer. */
    timestamp: number;
    /** Destination of the transfer message: this wallet's jetton-wallet address. */
    jettonWalletAddress: string;
    /** Transferred (or burned) amount in base jetton units (always > 0). */
    amount: bigint;
}

/**
 * Outgoing spend recovered from a page of account transactions: netted TON
 * entries ready to use, and unresolved jetton outflows awaiting master lookup.
 */
export interface TransactionSpend {
    /** Net TON spend entries (one per transaction with positive net outflow). */
    tonEntries: SpendEntry[];
    /** Outgoing jetton transfers, keyed by jetton-wallet address (unresolved). */
    jettonProbes: JettonSpendProbe[];
}

/**
 * Amounts the pending (not-yet-broadcast) transaction will spend, grouped by
 * normalized asset key.
 */
export interface PendingSpend {
    /** Total TON outflow across all messages, in nanotons. */
    ton: bigint;
    /** Normalized jetton-master address -> outflow amount in base jetton units. */
    jettons: Map<string, bigint>;
}
