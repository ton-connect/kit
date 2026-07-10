/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Transaction } from '@ton/walletkit';

import { normalizeAddressForComparison } from '../utils/address.js';
import { TON_ASSET_KEY } from './limits-codec.js';
import { parseJettonOutflowAmount } from './jetton.js';
import type { JettonSpendProbe, SpendEntry, TransactionSpend } from './types.js';

/**
 * Reduce a page of account transactions into per-transaction net outgoing-spend
 * for `walletAddress`, parsing jetton transfers directly from message bodies
 * (`getAccountTransactions` carries the raw messages, where `getEvents` returned
 * pre-decoded — but unreliable and capped — trace actions).
 *
 * - TON: per transaction, `net = sum(out-message values) - in-message value`, and
 *   only positive net is recorded. For an operator-signed agentic send the trigger
 *   is an external message (value 0), so net equals the gross outflow — the same
 *   amount the pending-spend estimate meters. The subtraction only bites when one
 *   transaction both receives an internal credit and forwards funds (a contract
 *   call metered at its net cost, e.g. receive 0.1 then send 1 counts as 0.9), and
 *   it accounts for the forward/gas TON attached to a jetton-transfer message.
 *   A send that later bounces is not refunded here: its outflow stays counted until
 *   the rolling window rolls past it (conservative — it over-blocks, never bypasses).
 * - Jettons: every out-message carrying a TEP-74 transfer/burn op yields a probe
 *   (amount + jetton-wallet address); {@link resolveJettonProbes} maps the wallet to
 *   its master via the cached forward map and aggregates. Incoming jettons arrive as
 *   transfer-notifications, never as a transfer/burn op, so they are not picked up here.
 *
 * Transactions whose compute phase explicitly failed are skipped; their actions
 * were reverted and moved no funds.
 */
export function transactionsToSpend(transactions: Transaction[], walletAddress: string): TransactionSpend {
    const walletRaw = normalizeAddressForComparison(walletAddress);
    if (!walletRaw) {
        return { tonEntries: [], jettonProbes: [] };
    }

    const tonEntries: SpendEntry[] = [];
    const jettonProbes: JettonSpendProbe[] = [];

    for (const transaction of transactions) {
        if (transaction.description?.computePhase?.isSuccess === false) {
            continue;
        }

        let tonOut = 0n;
        for (const message of transaction.outMessages) {
            if (!isFromWallet(message.source, walletRaw)) {
                continue;
            }
            tonOut += toBigInt(message.value);
            const outflow = parseJettonOutflowAmount(message.messageContent?.body);
            if (outflow && outflow > 0n && message.destination) {
                jettonProbes.push({
                    timestamp: transaction.now,
                    jettonWalletAddress: message.destination,
                    amount: outflow,
                });
            }
        }

        const tonNet = tonOut - toBigInt(transaction.inMessage?.value);
        if (tonNet > 0n) {
            tonEntries.push({ timestamp: transaction.now, asset: TON_ASSET_KEY, amount: tonNet });
        }
    }

    return { tonEntries, jettonProbes };
}

/**
 * Resolve unresolved jetton outflows to spend entries via the cached reverse map
 * (`our-jetton-wallet -> master`). A probe whose destination is not one of our own
 * jetton-wallets (no configured limit) yields no entry — the same in-memory lookup
 * the pending-spend estimate uses, so history and pending meter identically with no
 * `get_wallet_data` calls.
 */
export function resolveJettonProbes(probes: JettonSpendProbe[], reverseJettonMap: Map<string, string>): SpendEntry[] {
    const entries: SpendEntry[] = [];
    for (const probe of probes) {
        const walletKey = normalizeAddressForComparison(probe.jettonWalletAddress);
        const master = walletKey ? reverseJettonMap.get(walletKey) : undefined;
        if (master) {
            entries.push({ timestamp: probe.timestamp, asset: master, amount: probe.amount });
        }
    }
    return entries;
}

/** Sum recorded spend for `asset` within the last `windowSeconds` (inclusive of `now - window`). */
export function sumSpendWithinWindow(entries: SpendEntry[], asset: string, now: number, windowSeconds: number): bigint {
    const cutoff = now - windowSeconds;
    let total = 0n;
    for (const entry of entries) {
        if (entry.asset === asset && entry.timestamp >= cutoff) {
            total += entry.amount;
        }
    }
    return total;
}

/**
 * Whether an out-message was emitted by this wallet. Messages in the `outMessages`
 * list of a transaction on the wallet's account are emitted by it, but the indexer
 * may omit `source`; an absent source is treated as the wallet, a present one must
 * match.
 */
function isFromWallet(source: string | undefined, walletRaw: string): boolean {
    if (!source) {
        return true;
    }
    return normalizeAddressForComparison(source) === walletRaw;
}

function toBigInt(value: bigint | string | number | undefined): bigint {
    if (value === undefined) {
        return 0n;
    }
    try {
        return typeof value === 'bigint' ? value : BigInt(value);
    } catch {
        return 0n;
    }
}
