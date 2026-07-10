/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Canonical codec for the on-chain `limitsDict` (`map<address, map<uint32, coins>>`).
 *
 * The contract never parses or stores this dictionary: limits are carried in the
 * `ChangeNftContentMsg` (opcode 0x1a0b9d51) body and recovered off-chain. The
 * integrity anchor is `limits_hash` = the cell-representation hash of
 * `beginCell().storeDictDirect(limitsDict).endCell()`. The setter (dashboard) and
 * this verifier agree by using the canonical TON dictionary serialization for the
 * declared TL-B type, so no separate canonicalization spec is needed.
 */

import { Address, beginCell, Dictionary } from '@ton/core';
import type { Slice, Cell } from '@ton/core';

import { normalizeAddressForComparison } from '../utils/address.js';
import type { StoredLimits } from '../registry/config.js';
import type { LimitsDict } from './types.js';

/** Opcode of the owner-signed ChangeNftContentMsg that carries the limitsDict. */
export const CHANGE_NFT_CONTENT_OP = 0x1a0b9d51;

/** Length-prefix width of TON `coins` (VarUInteger 16). */
const COINS_VARUINT_BITS = 4;

/** Asset key used for native TON in `StoredLimits` and `SpendEntry`. */
export const TON_ASSET_KEY = 'TON';

/** TON sentinel asset address: workchain 0, all-zero hash (`0:00..00`). */
export const TON_SENTINEL_ADDRESS = new Address(0, Buffer.alloc(32));

function isTonSentinel(address: Address): boolean {
    return address.workChain === 0 && address.hash.equals(Buffer.alloc(32));
}

/** Stored/limits asset key for an on-chain asset address. */
export function assetKeyForAddress(address: Address): string {
    return isTonSentinel(address) ? TON_ASSET_KEY : address.toString();
}

/**
 * Normalize an asset key for comparison: `'TON'` is preserved; an address is reduced
 * to its raw form. Returns `null` for a non-TON key that is not a valid address, so
 * callers can reject corrupt config rather than silently storing an unmatchable key.
 */
export function normalizeAssetKey(key: string): string | null {
    if (key === TON_ASSET_KEY) {
        return TON_ASSET_KEY;
    }
    return normalizeAddressForComparison(key);
}

/** The inner `map<uint32, coins>` value serializer for the outer asset dictionary. */
function innerWindowsValue() {
    return Dictionary.Values.Dictionary(Dictionary.Keys.Uint(32), Dictionary.Values.BigVarUint(COINS_VARUINT_BITS));
}

function emptyWindows(): Dictionary<number, bigint> {
    return Dictionary.empty(Dictionary.Keys.Uint(32), Dictionary.Values.BigVarUint(COINS_VARUINT_BITS));
}

/** An empty `limitsDict` keyed by asset address. */
export function emptyLimitsDict(): LimitsDict {
    return Dictionary.empty(Dictionary.Keys.Address(), innerWindowsValue());
}

/** Canonical cell of the limitsDict; its hash is the on-chain `limits_hash`. */
export function serializeLimitsDict(dict: LimitsDict): Cell {
    return beginCell().storeDictDirect(dict).endCell();
}

/** Hex-encoded canonical hash of the limitsDict (matches the on-chain `limits_hash`). */
export function computeLimitsHash(dict: LimitsDict): string {
    return serializeLimitsDict(dict).hash().toString('hex');
}

/**
 * Parse the `limitsDict` from a ChangeNftContentMsg body.
 *
 * Body layout: `op:uint32, queryId:uint64, newNftItemContent:Maybe ^Cell, limitsDict`.
 * The contract only reads up to `newNftItemContent`; the trailing dictionary is the
 * off-chain limits payload appended by the setter.
 *
 * Returns `null` when the body is not a ChangeNftContentMsg or carries no dictionary.
 */
export function parseLimitsDictFromMessageBody(body: Cell): LimitsDict | null {
    try {
        const slice: Slice = body.beginParse();
        if (slice.remainingBits < 32 + 64) {
            return null;
        }
        if (slice.loadUint(32) !== CHANGE_NFT_CONTENT_OP) {
            return null;
        }
        slice.loadUintBig(64); // queryId
        slice.loadMaybeRef(); // newNftItemContent
        if (slice.remainingBits < 1) {
            return null; // no trailing limitsDict (e.g. a plain rename)
        }
        return slice.loadDict(Dictionary.Keys.Address(), innerWindowsValue());
    } catch {
        return null;
    }
}

/** Decode a parsed `limitsDict` into the JSON-friendly `StoredLimits` config shape. */
export function limitsDictToStored(dict: LimitsDict): StoredLimits {
    const assets: StoredLimits['assets'] = {};
    for (const assetAddress of dict.keys()) {
        const windowsDict = dict.get(assetAddress);
        if (!windowsDict) {
            continue;
        }
        const windows: Record<string, string> = {};
        for (const windowSeconds of windowsDict.keys()) {
            const amount = windowsDict.get(windowSeconds);
            if (amount === undefined) {
                continue;
            }
            windows[String(windowSeconds)] = amount.toString();
        }
        assets[assetKeyForAddress(assetAddress)] = { windows };
    }
    return { assets };
}

/**
 * Re-encode `StoredLimits` into a `limitsDict`. The resulting cell hash is
 * deterministic regardless of key insertion order (TON serializes dictionaries
 * canonically), so it round-trips with {@link computeLimitsHash}.
 */
export function storedToLimitsDict(stored: StoredLimits): LimitsDict {
    const dict = emptyLimitsDict();
    for (const [assetKey, assetLimit] of Object.entries(stored.assets)) {
        const windows = emptyWindows();
        for (const [windowSeconds, amount] of Object.entries(assetLimit.windows)) {
            windows.set(Number(windowSeconds), BigInt(amount));
        }
        const address = assetKey === TON_ASSET_KEY ? TON_SENTINEL_ADDRESS : Address.parse(assetKey);
        dict.set(address, windows);
    }
    return dict;
}
