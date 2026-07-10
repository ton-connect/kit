/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Pure, RPC-free metering of what a not-yet-broadcast transaction will spend.
 *
 * Jetton resolution uses a forward map computed once at limits-sync time: our
 * jetton-wallet address for each configured master. {@link buildReverseJettonMap}
 * inverts it to `our-jetton-wallet -> master`, so {@link buildPendingSpend} can
 * resolve a transfer's destination to its master with an in-memory lookup instead
 * of a per-send `get_wallet_data` call.
 */

import { normalizeAddressForComparison } from '../utils/address.js';
import { normalizeAssetKey } from './limits-codec.js';
import { parseJettonOutflowAmount } from './jetton.js';
import type { PendingSpend } from './types.js';

/**
 * Minimal view of an outgoing transaction message the spend meter reads: the
 * destination address, the attached TON `amount`, and the optional `payload`
 * (a TEP-74 transfer/burn body for jetton sends). Structurally a superset-safe
 * subset of the wallet `TransactionRequestMessage`.
 */
export interface SpendMessage {
    address: string;
    amount?: string;
    payload?: string | null;
}

/** Parse a message `amount` (nanotons) into a non-negative bigint; 0 on absence/garbage. */
function parseMessageAmount(amount: string | undefined): bigint {
    if (!amount) {
        return 0n;
    }
    try {
        const value = BigInt(amount);
        return value > 0n ? value : 0n;
    } catch {
        return 0n;
    }
}

/**
 * Invert the cached forward map (`masterDisplayKey -> our jetton-wallet`) into a
 * lookup keyed by the normalized jetton-wallet address, valued by the normalized
 * master key. The master value matches `normalizeAssetKey(displayKey)`, the same
 * key `indexLimits`/`affectedAssets` use, so resolved spend lines up with the
 * configured caps. Entries with an unparseable address or master key are dropped.
 */
export function buildReverseJettonMap(jettonWallets: Record<string, string>): Map<string, string> {
    const reverse = new Map<string, string>();
    for (const [masterDisplayKey, walletAddress] of Object.entries(jettonWallets)) {
        const wallet = normalizeAddressForComparison(walletAddress);
        const master = normalizeAssetKey(masterDisplayKey);
        if (wallet && master) {
            reverse.set(wallet, master);
        }
    }
    return reverse;
}

/**
 * Sum the TON and (master-resolved) jetton outflows a pending request will spend.
 * Pure and synchronous: a jetton transfer is metered only when its destination is
 * one of our own jetton-wallets in {@link buildReverseJettonMap}; transfers to any
 * other wallet target an unconfigured/unlimited jetton and are ignored.
 */
export function buildPendingSpend(
    messages: readonly SpendMessage[],
    reverseJettonMap: Map<string, string>,
): PendingSpend {
    let ton = 0n;
    const jettons = new Map<string, bigint>();
    for (const message of messages) {
        const amount = parseMessageAmount(message.amount);
        if (amount > 0n) {
            ton += amount;
        }
        const outflow = parseJettonOutflowAmount(message.payload);
        if (outflow && outflow > 0n) {
            const walletKey = normalizeAddressForComparison(message.address);
            const master = walletKey ? reverseJettonMap.get(walletKey) : undefined;
            if (master) {
                jettons.set(master, (jettons.get(master) ?? 0n) + outflow);
            }
        }
    }
    return { ton, jettons };
}
