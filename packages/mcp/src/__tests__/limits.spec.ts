/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address, Dictionary, beginCell } from '@ton/core';
import type { Cell } from '@ton/core';
import type { Base64String, Hex, Transaction } from '@ton/walletkit';
import { describe, expect, it, vi } from 'vitest';

import {
    CHANGE_NFT_CONTENT_OP,
    TON_ASSET_KEY,
    assetKeyForAddress,
    computeLimitsHash,
    limitsDictToStored,
    normalizeAssetKey,
    parseLimitsDictFromMessageBody,
    storedToLimitsDict,
} from '../limits/limits-codec.js';
import {
    computeLimitsUsage,
    evaluateLimits,
    findLimitViolation,
    formatLimitViolation,
    loadActiveLimits,
    maxConfiguredWindow,
    maxRelevantWindow,
} from '../limits/enforce.js';
import type { LimitsCache, LimitsEnv } from '../limits/enforce.js';
import { parseJettonOutflowAmount } from '../limits/jetton.js';
import { buildPendingSpend, buildReverseJettonMap } from '../limits/pending.js';
import type { SpendMessage } from '../limits/pending.js';
import { resolveJettonProbes, sumSpendWithinWindow, transactionsToSpend } from '../limits/spend-window.js';
import type { JettonSpendProbe, LimitsDict, PendingSpend, SpendEntry } from '../limits/types.js';
import type { StoredLimits } from '../registry/config.js';
import { McpWalletService } from '../services/McpWalletService.js';
import { onchainMetadataKey } from '../utils/tep64.js';

const SENTINEL = new Address(0, Buffer.alloc(32));
const JETTON = new Address(0, Buffer.alloc(32, 7));
const JETTON_KEY = JETTON.toRawString();

const WALLET = new Address(0, Buffer.alloc(32, 1)).toString();
const OTHER = new Address(0, Buffer.alloc(32, 2)).toString();
const RECIPIENT = OTHER;
const JETTON_WALLET = new Address(0, Buffer.alloc(32, 3)).toString();

const JETTON_TRANSFER_OP = 0x0f8a7ea5;
const JETTON_BURN_OP = 0x595f07bc;

const NOW = 1000;

// -------------------------------------------------------------------------------------------------
// limits-codec
// -------------------------------------------------------------------------------------------------

const STORED: StoredLimits = {
    assets: {
        [TON_ASSET_KEY]: { windows: { '0': '5000000000', '3600': '20000000000' } },
        [JETTON.toString()]: { windows: { '86400': '1000' } },
    },
};

/** A ChangeNftContentMsg body carrying `dict` after the (here empty) NFT content. */
function changeContentBody(dict: LimitsDict, op = CHANGE_NFT_CONTENT_OP) {
    return beginCell().storeUint(op, 32).storeUint(1n, 64).storeMaybeRef(null).storeDict(dict).endCell();
}

describe('limits-codec asset keys', () => {
    it('maps the zero address to the TON sentinel and jettons to their master', () => {
        expect(assetKeyForAddress(SENTINEL)).toBe(TON_ASSET_KEY);
        expect(assetKeyForAddress(JETTON)).toBe(JETTON.toString());
    });

    it('normalizes keys to a comparable form and rejects non-addresses', () => {
        expect(normalizeAssetKey(TON_ASSET_KEY)).toBe(TON_ASSET_KEY);
        expect(normalizeAssetKey(JETTON.toString())).toBe(JETTON.toRawString());
        expect(normalizeAssetKey('not-an-address')).toBeNull();
    });
});

describe('limits-codec round-trip', () => {
    it('round-trips StoredLimits -> dict -> StoredLimits', () => {
        expect(limitsDictToStored(storedToLimitsDict(STORED))).toEqual(STORED);
    });

    it('computes a hash invariant under asset- and window-key insertion order', () => {
        const reordered: StoredLimits = {
            assets: {
                [JETTON.toString()]: { windows: { '86400': '1000' } },
                [TON_ASSET_KEY]: { windows: { '3600': '20000000000', '0': '5000000000' } },
            },
        };
        expect(computeLimitsHash(storedToLimitsDict(reordered))).toBe(computeLimitsHash(storedToLimitsDict(STORED)));
    });

    it('parses the limitsDict back out of a ChangeNftContentMsg body', () => {
        const dict = storedToLimitsDict(STORED);
        const parsed = parseLimitsDictFromMessageBody(changeContentBody(dict));
        expect(parsed).not.toBeNull();
        expect(limitsDictToStored(parsed!)).toEqual(STORED);
        expect(computeLimitsHash(parsed!)).toBe(computeLimitsHash(dict));
    });

    it('returns null for a non-ChangeNftContentMsg opcode', () => {
        expect(parseLimitsDictFromMessageBody(changeContentBody(storedToLimitsDict(STORED), 0x12345678))).toBeNull();
    });

    it('returns null for a ChangeNftContentMsg with no trailing limitsDict', () => {
        const body = beginCell().storeUint(CHANGE_NFT_CONTENT_OP, 32).storeUint(1n, 64).storeMaybeRef(null).endCell();
        expect(parseLimitsDictFromMessageBody(body)).toBeNull();
    });
});

// -------------------------------------------------------------------------------------------------
// limits enforcement (findLimitViolation / maxRelevantWindow / formatLimitViolation / evaluateLimits)
// -------------------------------------------------------------------------------------------------

const LIMITS: StoredLimits = {
    assets: {
        [TON_ASSET_KEY]: { windows: { '0': '5', '3600': '20' } },
        [JETTON.toString()]: { windows: { '86400': '1000' } },
    },
};

function ton(amount: bigint): PendingSpend {
    return { ton: amount, jettons: new Map() };
}

/** A single TON-only message carrying `amount` nanotons, for the message-based enforcement path. */
function tonMessages(amount: bigint): SpendMessage[] {
    return [{ address: RECIPIENT, amount: amount.toString() }];
}

describe('findLimitViolation', () => {
    it('blocks a transaction over the per-transaction (window 0) cap', () => {
        const v = findLimitViolation(LIMITS, ton(6n), [], NOW);
        expect(v).toMatchObject({ asset: TON_ASSET_KEY, windowSeconds: 0, limit: 5n, pending: 6n });
    });

    it('blocks when prior rolling-window spend plus the pending amount exceeds the cap', () => {
        const entries: SpendEntry[] = [{ timestamp: NOW - 100, asset: TON_ASSET_KEY, amount: 18n }];
        const v = findLimitViolation(LIMITS, ton(4n), entries, NOW);
        expect(v).toMatchObject({ windowSeconds: 3600, limit: 20n, alreadySpent: 18n, pending: 4n, total: 22n });
    });

    it('allows a transaction whose rolling total exactly equals the cap', () => {
        const entries: SpendEntry[] = [{ timestamp: NOW - 100, asset: TON_ASSET_KEY, amount: 18n }];
        expect(findLimitViolation(LIMITS, ton(2n), entries, NOW)).toBeNull();
    });

    it('reports the per-transaction cap first when both windows are breached', () => {
        const entries: SpendEntry[] = [{ timestamp: NOW - 100, asset: TON_ASSET_KEY, amount: 18n }];
        expect(findLimitViolation(LIMITS, ton(6n), entries, NOW)?.windowSeconds).toBe(0);
    });

    it('meters jettons against their own master cap', () => {
        const spend: PendingSpend = { ton: 0n, jettons: new Map([[JETTON_KEY, 600n]]) };
        const entries: SpendEntry[] = [{ timestamp: NOW - 100, asset: JETTON_KEY, amount: 500n }];
        expect(findLimitViolation(LIMITS, spend, entries, NOW)).toMatchObject({ windowSeconds: 86400, total: 1100n });
    });

    it('ignores assets that have no configured limit', () => {
        const spend: PendingSpend = { ton: 0n, jettons: new Map([['0:dead', 10n ** 30n]]) };
        expect(findLimitViolation(LIMITS, spend, [], NOW)).toBeNull();
    });

    it('fails closed (throws) on malformed config', () => {
        expect(() => findLimitViolation({ assets: { TON: { windows: { abc: '5' } } } }, ton(1n), [], NOW)).toThrow();
        expect(() => findLimitViolation({ assets: { xyz: { windows: { '0': '5' } } } }, ton(1n), [], NOW)).toThrow();
        expect(() => findLimitViolation({ assets: { TON: { windows: { '0': '-5' } } } }, ton(1n), [], NOW)).toThrow();
    });
});

describe('maxRelevantWindow', () => {
    it('returns the largest rolling window touched by the spend', () => {
        expect(maxRelevantWindow(LIMITS, ton(1n))).toBe(3600);
    });

    it('returns 0 when only a per-transaction limit applies', () => {
        const perTxOnly: StoredLimits = { assets: { [TON_ASSET_KEY]: { windows: { '0': '5' } } } };
        expect(maxRelevantWindow(perTxOnly, ton(1n))).toBe(0);
    });
});

describe('formatLimitViolation', () => {
    it('describes per-transaction and rolling breaches distinctly', () => {
        expect(formatLimitViolation(findLimitViolation(LIMITS, ton(6n), [], NOW)!)).toContain('per-transaction');
        const rolling = findLimitViolation(
            LIMITS,
            ton(4n),
            [{ timestamp: NOW, asset: TON_ASSET_KEY, amount: 18n }],
            NOW,
        )!;
        expect(formatLimitViolation(rolling)).toContain('rolling 1h');
    });
});

describe('evaluateLimits', () => {
    function env(overrides: Partial<LimitsEnv>): LimitsEnv {
        return {
            now: () => NOW,
            readOnchainLimitsHash: async () => 'hash-1',
            readCache: () => ({}),
            writeCache: async () => {},
            syncLimitsFromChain: async () => ({ limits: LIMITS, hash: 'hash-1', jettonWallets: {} }),
            fetchSpendEntries: async () => [],
            ...overrides,
        };
    }

    it('allows when the wallet has no on-chain limits (none -> allowed)', async () => {
        const decision = await evaluateLimits(
            env({
                readOnchainLimitsHash: async () => undefined,
                readCache: () => ({ limits_hash: 'old' }),
            }),
            tonMessages(1n),
        );
        expect(decision.allowed).toBe(true);
    });

    it('does not write when there is no on-chain hash and no cache to clear', async () => {
        const writeCache = vi.fn(async () => {});
        await evaluateLimits(env({ readOnchainLimitsHash: async () => undefined, writeCache }), tonMessages(1n));
        expect(writeCache).not.toHaveBeenCalled();
    });

    it('refuses to send when no limits-change transaction can be found', async () => {
        const decision = await evaluateLimits(env({ syncLimitsFromChain: async () => null }), tonMessages(1n));
        expect(decision).toMatchObject({ allowed: false });
        expect(decision.allowed === false && decision.message).toContain('no limits-change');
    });

    it('skips the history fetch when only a per-transaction limit applies', async () => {
        const fetchSpendEntries = vi.fn(async () => []);
        const perTxOnly: StoredLimits = { assets: { [TON_ASSET_KEY]: { windows: { '0': '5' } } } };
        await evaluateLimits(
            env({
                syncLimitsFromChain: async () => ({ limits: perTxOnly, hash: 'hash-1', jettonWallets: {} }),
                fetchSpendEntries,
            }),
            tonMessages(1n),
        );
        expect(fetchSpendEntries).not.toHaveBeenCalled();
    });

    it('propagates (fails closed) when the history fetch throws', async () => {
        await expect(
            evaluateLimits(
                env({
                    fetchSpendEntries: async () => {
                        throw new Error('rpc down');
                    },
                }),
                tonMessages(1n),
            ),
        ).rejects.toThrow('rpc down');
    });

    it('meters a configured jetton via the cached forward map with no extra resolution', async () => {
        const fetchSpendEntries = vi.fn(async () => []);
        const decision = await evaluateLimits(
            env({
                readCache: () => ({
                    limits: LIMITS,
                    limits_hash: 'hash-1',
                    jetton_wallets: { [JETTON.toString()]: JETTON_WALLET },
                }),
                fetchSpendEntries,
            }),
            [{ address: JETTON_WALLET, amount: '0', payload: jettonTransferPayload(2000n) }],
        );
        // JETTON cap is 1000 over 86400s; a 2000 transfer breaches it.
        expect(decision).toMatchObject({ allowed: false });
        expect(decision.allowed === false && decision.message).toContain('spend limit');
        expect(fetchSpendEntries).toHaveBeenCalledWith(86400, NOW, expect.any(Map));
    });

    it('ignores a jetton transfer whose wallet is not in the forward map (unlimited jetton)', async () => {
        const decision = await evaluateLimits(
            env({
                readCache: () => ({ limits: LIMITS, limits_hash: 'hash-1', jetton_wallets: {} }),
            }),
            [{ address: JETTON_WALLET, amount: '0', payload: jettonTransferPayload(10n ** 18n) }],
        );
        expect(decision.allowed).toBe(true);
    });

    it('blocks an over-limit spend with a descriptive message', async () => {
        const decision = await evaluateLimits(env({}), tonMessages(6n));
        expect(decision).toMatchObject({ allowed: false });
        expect(decision.allowed === false && decision.message).toContain('spend limit');
    });
});

describe('loadActiveLimits', () => {
    const FORWARD_MAP = { [JETTON.toString()]: JETTON_WALLET };

    function env(overrides: Partial<LimitsEnv>): LimitsEnv {
        return {
            now: () => NOW,
            readOnchainLimitsHash: async () => 'hash-1',
            readCache: () => ({}),
            writeCache: async () => {},
            syncLimitsFromChain: async () => ({ limits: LIMITS, hash: 'hash-1', jettonWallets: FORWARD_MAP }),
            fetchSpendEntries: async () => [],
            ...overrides,
        };
    }

    it('reports none and clears a stale cache when no on-chain limits are set', async () => {
        const writeCache = vi.fn(async () => {});
        const loaded = await loadActiveLimits(
            env({
                readOnchainLimitsHash: async () => undefined,
                readCache: () => ({ limits_hash: 'old' }),
                writeCache,
            }),
        );
        expect(loaded).toEqual({ status: 'none' });
        expect(writeCache).toHaveBeenCalledWith({});
    });

    it('returns the cached limits and forward map without re-syncing when both are present', async () => {
        const syncLimitsFromChain = vi.fn(async () => ({ limits: LIMITS, hash: 'hash-1', jettonWallets: FORWARD_MAP }));
        const loaded = await loadActiveLimits(
            env({
                readCache: () => ({ limits: LIMITS, limits_hash: 'hash-1', jetton_wallets: FORWARD_MAP }),
                syncLimitsFromChain,
            }),
        );
        expect(loaded).toEqual({ status: 'active', limits: LIMITS, hash: 'hash-1', jettonWallets: FORWARD_MAP });
        expect(syncLimitsFromChain).not.toHaveBeenCalled();
    });

    it('re-syncs and persists limits, hash, and forward map when the cache is stale', async () => {
        const writeCache = vi.fn(async () => {});
        const loaded = await loadActiveLimits(env({ readCache: () => ({}), writeCache }));
        expect(loaded).toEqual({ status: 'active', limits: LIMITS, hash: 'hash-1', jettonWallets: FORWARD_MAP });
        expect(writeCache).toHaveBeenCalledWith({ limits: LIMITS, limits_hash: 'hash-1', jetton_wallets: FORWARD_MAP });
    });

    it('treats a legacy cache that has limits but no forward map as a miss and re-syncs', async () => {
        const writeCache = vi.fn(async () => {});
        const syncLimitsFromChain = vi.fn(async () => ({ limits: LIMITS, hash: 'hash-1', jettonWallets: FORWARD_MAP }));
        const loaded = await loadActiveLimits(
            env({
                // Same hash as on-chain, but no jetton_wallets (pre-forward-map record).
                readCache: () => ({ limits: LIMITS, limits_hash: 'hash-1' }),
                writeCache,
                syncLimitsFromChain,
            }),
        );
        expect(syncLimitsFromChain).toHaveBeenCalledOnce();
        expect(loaded).toEqual({ status: 'active', limits: LIMITS, hash: 'hash-1', jettonWallets: FORWARD_MAP });
        expect(writeCache).toHaveBeenCalledWith({ limits: LIMITS, limits_hash: 'hash-1', jetton_wallets: FORWARD_MAP });
    });

    it('does not persist a partial cache when the forward-map sync throws', async () => {
        const writeCache = vi.fn(async () => {});
        await expect(
            loadActiveLimits(
                env({
                    readCache: () => ({}),
                    writeCache,
                    syncLimitsFromChain: async () => {
                        throw new Error('jetton-wallet unresolved');
                    },
                }),
            ),
        ).rejects.toThrow('jetton-wallet unresolved');
        expect(writeCache).not.toHaveBeenCalled();
    });

    it('reports an error when no limits-change transaction can be found', async () => {
        const loaded = await loadActiveLimits(env({ syncLimitsFromChain: async () => null }));
        expect(loaded.status).toBe('error');
        expect(loaded.status === 'error' && loaded.message).toContain('no limits-change');
    });

    it('reports an error when the synced hash does not match the on-chain hash', async () => {
        const loaded = await loadActiveLimits(
            env({ syncLimitsFromChain: async () => ({ limits: LIMITS, hash: 'other', jettonWallets: FORWARD_MAP }) }),
        );
        expect(loaded.status).toBe('error');
        expect(loaded.status === 'error' && loaded.message).toContain('does not match');
    });
});

describe('maxConfiguredWindow', () => {
    it('returns the largest rolling window across all assets', () => {
        expect(maxConfiguredWindow(LIMITS)).toBe(86400);
    });

    it('returns 0 when only per-transaction limits are configured', () => {
        expect(maxConfiguredWindow({ assets: { [TON_ASSET_KEY]: { windows: { '0': '5' } } } })).toBe(0);
    });
});

describe('computeLimitsUsage', () => {
    it('reports spent and remaining per asset and window, with per-tx windows un-metered', () => {
        const entries: SpendEntry[] = [
            { timestamp: NOW - 100, asset: TON_ASSET_KEY, amount: 12n },
            { timestamp: NOW - 100, asset: JETTON_KEY, amount: 400n },
        ];
        const usage = computeLimitsUsage(LIMITS, entries, NOW);

        const ton = usage.find((a) => a.asset === TON_ASSET_KEY);
        expect(ton?.windows).toEqual([
            { windowSeconds: 0, limit: '5', spent: '0', remaining: '5' },
            { windowSeconds: 3600, limit: '20', spent: '12', remaining: '8' },
        ]);

        const jetton = usage.find((a) => a.asset === JETTON.toString());
        expect(jetton?.windows).toEqual([{ windowSeconds: 86400, limit: '1000', spent: '400', remaining: '600' }]);
    });

    it('clamps remaining at zero when spend already exceeds the cap', () => {
        const entries: SpendEntry[] = [{ timestamp: NOW - 100, asset: TON_ASSET_KEY, amount: 25n }];
        const ton = computeLimitsUsage(LIMITS, entries, NOW).find((a) => a.asset === TON_ASSET_KEY);
        expect(ton?.windows.find((w) => w.windowSeconds === 3600)).toEqual({
            windowSeconds: 3600,
            limit: '20',
            spent: '25',
            remaining: '0',
        });
    });

    it('excludes spend older than the window', () => {
        const entries: SpendEntry[] = [{ timestamp: NOW - 4000, asset: TON_ASSET_KEY, amount: 12n }];
        const ton = computeLimitsUsage(LIMITS, entries, NOW).find((a) => a.asset === TON_ASSET_KEY);
        expect(ton?.windows.find((w) => w.windowSeconds === 3600)?.spent).toBe('0');
    });

    it('fails closed (throws) on a malformed asset key', () => {
        expect(() => computeLimitsUsage({ assets: { xyz: { windows: { '0': '5' } } } }, [], NOW)).toThrow();
    });
});

// -------------------------------------------------------------------------------------------------
// limits-jetton (parseJettonOutflowAmount)
// -------------------------------------------------------------------------------------------------

function opBody(op: number, amount: bigint): string {
    return beginCell().storeUint(op, 32).storeUint(0n, 64).storeCoins(amount).endCell().toBoc().toString('base64');
}

/** TVM stack item carrying an address as a serialized cell, as `runGetMethod` returns it. */
function addressStackItem(address: Address) {
    return { type: 'cell' as const, value: beginCell().storeAddress(address).endCell().toBoc().toString('base64') };
}

describe('parseJettonOutflowAmount', () => {
    it('reads the amount from a transfer or burn op', () => {
        expect(parseJettonOutflowAmount(opBody(JETTON_TRANSFER_OP, 1234n))).toBe(1234n);
        expect(parseJettonOutflowAmount(opBody(JETTON_BURN_OP, 77n))).toBe(77n);
    });

    it('returns null for a non-transfer op, an empty payload, or garbage', () => {
        expect(parseJettonOutflowAmount(opBody(0, 1n))).toBeNull();
        expect(parseJettonOutflowAmount(null)).toBeNull();
        expect(parseJettonOutflowAmount(undefined)).toBeNull();
        expect(parseJettonOutflowAmount('not-base64!!')).toBeNull();
    });
});

// -------------------------------------------------------------------------------------------------
// pending-spend forward map (buildReverseJettonMap / buildPendingSpend / resolveJettonProbes)
// -------------------------------------------------------------------------------------------------

describe('forward jetton-wallet map metering', () => {
    const reverse = buildReverseJettonMap({ [JETTON.toString()]: JETTON_WALLET });

    it('maps our jetton-wallet address to the normalized master key', () => {
        expect(reverse.get(normalizeAssetKey(JETTON_WALLET)!)).toBe(JETTON_KEY);
    });

    it('meters a configured jetton transfer against its master with no resolution call', () => {
        const spend = buildPendingSpend(
            [{ address: JETTON_WALLET, amount: '0', payload: jettonTransferPayload(600n) }],
            reverse,
        );
        expect(spend.ton).toBe(0n);
        expect(spend.jettons).toEqual(new Map([[JETTON_KEY, 600n]]));
    });

    it('sums TON and jetton outflows across messages, aggregating per master', () => {
        const spend = buildPendingSpend(
            [
                { address: RECIPIENT, amount: '1000' },
                { address: JETTON_WALLET, amount: '50', payload: jettonTransferPayload(200n) },
                { address: JETTON_WALLET, amount: '50', payload: jettonTransferPayload(300n) },
            ],
            reverse,
        );
        expect(spend.ton).toBe(1100n);
        expect(spend.jettons).toEqual(new Map([[JETTON_KEY, 500n]]));
    });

    it('ignores a jetton transfer to a wallet outside the forward map (unlimited jetton)', () => {
        const spend = buildPendingSpend(
            [{ address: OTHER, amount: '0', payload: jettonTransferPayload(10n ** 18n) }],
            reverse,
        );
        expect(spend.jettons.size).toBe(0);
    });

    it('resolves history probes through the same map and drops unknown wallets', () => {
        const probes: JettonSpendProbe[] = [
            { timestamp: 100, jettonWalletAddress: JETTON_WALLET, amount: 400n },
            { timestamp: 200, jettonWalletAddress: OTHER, amount: 999n },
        ];
        expect(resolveJettonProbes(probes, reverse)).toEqual([{ timestamp: 100, asset: JETTON_KEY, amount: 400n }]);
    });
});

// -------------------------------------------------------------------------------------------------
// limits-spend-window (transactionsToSpend / sumSpendWithinWindow)
// -------------------------------------------------------------------------------------------------

function jettonTransferBody(amount: bigint): string {
    return beginCell()
        .storeUint(JETTON_TRANSFER_OP, 32)
        .storeUint(0n, 64)
        .storeCoins(amount)
        .endCell()
        .toBoc()
        .toString('base64');
}

interface OutMsg {
    source?: string;
    destination?: string;
    value: string;
    body?: string;
}

function makeTx(input: { now: number; inValue?: string; outs?: OutMsg[]; computeSuccess?: boolean }): Transaction {
    return {
        account: WALLET,
        hash: 'tx' as Hex,
        logicalTime: '0',
        now: input.now,
        mcBlockSeqno: 0,
        traceExternalHash: 'trace' as Hex,
        isEmulated: false,
        inMessage: input.inValue === undefined ? undefined : { hash: 'in' as Hex, value: input.inValue },
        outMessages: (input.outs ?? []).map((out) => ({
            hash: 'out' as Hex,
            source: out.source,
            destination: out.destination,
            value: out.value,
            messageContent: out.body ? { body: out.body as Base64String } : undefined,
        })),
        description: {
            type: 'ord',
            isAborted: false,
            isDestroyed: false,
            isCreditFirst: false,
            isTock: false,
            isInstalled: false,
            computePhase: { isSuccess: input.computeSuccess ?? true },
        },
    };
}

describe('transactionsToSpend (TON)', () => {
    it('records the full outflow for an externally-triggered send (value-0 in-message)', () => {
        const spend = transactionsToSpend(
            [makeTx({ now: 100, outs: [{ source: WALLET, value: '1000000000' }] })],
            WALLET,
        );
        expect(spend.tonEntries).toEqual([{ timestamp: 100, asset: TON_ASSET_KEY, amount: 1000000000n }]);
    });

    it('meters a forwarding transaction at its net cost', () => {
        const spend = transactionsToSpend(
            [makeTx({ now: 100, inValue: '100000000', outs: [{ source: WALLET, value: '1000000000' }] })],
            WALLET,
        );
        expect(spend.tonEntries).toEqual([{ timestamp: 100, asset: TON_ASSET_KEY, amount: 900000000n }]);
    });

    it('records nothing for a purely incoming transaction', () => {
        const spend = transactionsToSpend([makeTx({ now: 100, inValue: '1000000000' })], WALLET);
        expect(spend.tonEntries).toEqual([]);
    });

    it('skips transactions whose compute phase failed', () => {
        const spend = transactionsToSpend(
            [makeTx({ now: 100, computeSuccess: false, outs: [{ source: WALLET, value: '1000000000' }] })],
            WALLET,
        );
        expect(spend.tonEntries).toEqual([]);
    });

    it('counts out-messages with an absent source but excludes a foreign source', () => {
        const absent = transactionsToSpend([makeTx({ now: 100, outs: [{ value: '5' }] })], WALLET);
        expect(absent.tonEntries).toEqual([{ timestamp: 100, asset: TON_ASSET_KEY, amount: 5n }]);
        const foreign = transactionsToSpend([makeTx({ now: 100, outs: [{ source: OTHER, value: '5' }] })], WALLET);
        expect(foreign.tonEntries).toEqual([]);
    });
});

describe('transactionsToSpend (jettons)', () => {
    it('emits a probe for an outgoing TEP-74 transfer', () => {
        const spend = transactionsToSpend(
            [
                makeTx({
                    now: 100,
                    outs: [
                        {
                            source: WALLET,
                            destination: JETTON_WALLET,
                            value: '50000000',
                            body: jettonTransferBody(500n),
                        },
                    ],
                }),
            ],
            WALLET,
        );
        expect(spend.jettonProbes).toEqual([{ timestamp: 100, jettonWalletAddress: JETTON_WALLET, amount: 500n }]);
    });
});

describe('sumSpendWithinWindow', () => {
    const entries: SpendEntry[] = [
        { timestamp: 940, asset: TON_ASSET_KEY, amount: 5n },
        { timestamp: 939, asset: TON_ASSET_KEY, amount: 7n },
        { timestamp: 1000, asset: 'jetton', amount: 9n },
    ];

    it('includes the entry exactly at the cutoff and excludes older ones', () => {
        expect(sumSpendWithinWindow(entries, TON_ASSET_KEY, 1000, 60)).toBe(5n);
    });

    it('filters by asset', () => {
        expect(sumSpendWithinWindow(entries, 'jetton', 1000, 60)).toBe(9n);
    });
});

// -------------------------------------------------------------------------------------------------
// McpWalletService send choke point
// -------------------------------------------------------------------------------------------------

function jettonTransferPayload(amount: bigint): string {
    return beginCell()
        .storeUint(0x0f8a7ea5, 32)
        .storeUint(0n, 64)
        .storeCoins(amount)
        .endCell()
        .toBoc()
        .toString('base64');
}

interface FakeWallet {
    version?: string;
    getAddress: () => string;
    getClient: () => unknown;
    sendTransaction: ReturnType<typeof vi.fn>;
    createTransferTonTransaction?: ReturnType<typeof vi.fn>;
}

function makeService(wallet: FakeWallet, limitsCache: LimitsCache | null = null): McpWalletService {
    const service = Object.create(McpWalletService.prototype) as McpWalletService;
    Object.defineProperty(service, 'wallet', { value: wallet, configurable: true });
    Object.defineProperty(service, 'config', { value: {}, configurable: true });
    Object.defineProperty(service, 'limitsCache', { value: limitsCache, configurable: true });
    return service;
}

// A jetton-only, per-transaction cap of 1000; its dict and canonical hash anchor the
// account state (on-chain limits_hash) and the limits-change transaction the sync reads.
const SERVICE_LIMITS: StoredLimits = { assets: { [JETTON.toString()]: { windows: { '0': '1000' } } } };
const SERVICE_LIMITS_DICT = storedToLimitsDict(SERVICE_LIMITS);
const SERVICE_LIMITS_HASH = computeLimitsHash(SERVICE_LIMITS_DICT);
const SERVICE_FORWARD_MAP = { [JETTON.toString()]: JETTON_WALLET };

// A jetton rolling-window cap (1000 per day). Unlike the per-transaction SERVICE_LIMITS
// above, this opens a real spend window, so enforcement must page history and resolve the
// recovered jetton outflows through the cached forward map.
const ROLLING_LIMITS: StoredLimits = { assets: { [JETTON.toString()]: { windows: { '86400': '1000' } } } };
const ROLLING_LIMITS_HASH = computeLimitsHash(storedToLimitsDict(ROLLING_LIMITS));

/** A TEP-64 onchain content cell carrying a single `limits_hash` attribute. */
function limitsHashContent(limitsHashHex: string): Cell {
    const dict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
    dict.set(
        onchainMetadataKey('limits_hash'),
        beginCell().storeUint(0x00, 8).storeStringTail(limitsHashHex).endCell(),
    );
    return beginCell().storeUint(0x00, 8).storeDict(dict).endCell();
}

/** A minimal agentic-wallet account state whose nft content advertises `limitsHashHex`. */
function agenticAccountState(limitsHashHex: string): { data: string } {
    const walletData = beginCell()
        .storeAddress(Address.parse(WALLET))
        .storeMaybeRef(limitsHashContent(limitsHashHex))
        .storeUint(0n, 256)
        .storeUint(0n, 256)
        .storeBit(false)
        .endCell();
    const state = beginCell()
        .storeUint(0n, 256)
        .storeAddress(new Address(0, Buffer.alloc(32, 5)))
        .storeBit(true)
        .storeUint(0, 32)
        .storeBit(false)
        .storeMaybeRef(walletData)
        .endCell();
    return { data: state.toBoc().toString('base64') };
}

/** A getAccountTransactions response carrying one limits-change tx for `dict`. */
function limitsChangeResponse(dict: LimitsDict) {
    const body = changeContentBody(dict).toBoc().toString('base64');
    return { transactions: [{ inMessage: { messageContent: { body } } }] };
}

/** A runGetMethod that answers `get_wallet_address` with `walletAddress`. */
function walletAddressGetMethod(walletAddress: Address) {
    return vi.fn(async (_address: string, method: string) => {
        if (method === 'get_wallet_address') {
            return { gasUsed: 0, exitCode: 0, stack: [addressStackItem(walletAddress)] };
        }
        throw new Error(`unexpected get-method: ${method}`);
    });
}

describe('McpWalletService send choke point', () => {
    it('skips limit enforcement for non-agentic wallets', async () => {
        const sendTransaction = vi.fn().mockResolvedValue({ normalizedHash: 'hash' });
        const getAccountState = vi.fn();
        const service = makeService({
            version: undefined,
            getAddress: () => WALLET,
            getClient: () => ({ getAccountState }),
            sendTransaction,
        });

        const result = await service.sendRawTransaction({
            messages: [{ address: RECIPIENT, amount: '1000000000' }],
        });

        expect(result.success).toBe(true);
        expect(getAccountState).not.toHaveBeenCalled();
        expect(sendTransaction).toHaveBeenCalledOnce();
    });

    it('fails closed when an agentic wallet cannot read its on-chain limits', async () => {
        const sendTransaction = vi.fn();
        const service = makeService({
            version: 'agentic',
            getAddress: () => WALLET,
            getClient: () => ({
                getAccountState: vi.fn().mockRejectedValue(new Error('indexer down')),
                runGetMethod: vi.fn(),
            }),
            sendTransaction,
        });

        const result = await service.sendRawTransaction({
            messages: [{ address: RECIPIENT, amount: '1000000000' }],
        });

        expect(result.success).toBe(false);
        expect(result.message).toContain('Could not verify spend limits');
        expect(sendTransaction).not.toHaveBeenCalled();
    });

    it('fails closed all-or-nothing when a jetton master wallet cannot be resolved at sync', async () => {
        const sendTransaction = vi.fn();
        const write = vi.fn(async () => {});
        const runGetMethod = vi.fn().mockRejectedValue(new Error('429 Too Many Requests'));
        const service = makeService(
            {
                version: 'agentic',
                getAddress: () => WALLET,
                getClient: () => ({
                    getAccountState: vi.fn().mockResolvedValue(agenticAccountState(SERVICE_LIMITS_HASH)),
                    getAccountTransactions: vi.fn().mockResolvedValue(limitsChangeResponse(SERVICE_LIMITS_DICT)),
                    runGetMethod,
                }),
                sendTransaction,
            },
            { read: () => ({}), write },
        );

        const result = await service.sendRawTransaction({
            messages: [{ address: JETTON_WALLET, amount: '50000000', payload: jettonTransferPayload(500n) }],
        });

        expect(result.success).toBe(false);
        expect(result.message).toContain('Could not verify spend limits');
        expect(sendTransaction).not.toHaveBeenCalled();
        // No partial persist: a half-computed forward map must never reach the cache.
        expect(write).not.toHaveBeenCalled();
    });

    it('meters a configured jetton via the synced forward map without any get_wallet_data call', async () => {
        const sendTransaction = vi.fn();
        const runGetMethod = walletAddressGetMethod(new Address(0, Buffer.alloc(32, 3)));
        const getAccountTransactions = vi.fn().mockResolvedValue(limitsChangeResponse(SERVICE_LIMITS_DICT));
        const service = makeService({
            version: 'agentic',
            getAddress: () => WALLET,
            getClient: () => ({
                getAccountState: vi.fn().mockResolvedValue(agenticAccountState(SERVICE_LIMITS_HASH)),
                getAccountTransactions,
                runGetMethod,
            }),
            sendTransaction,
        });

        // 2000 > the per-transaction cap of 1000 -> blocked by the jetton limit.
        const result = await service.sendRawTransaction({
            messages: [{ address: JETTON_WALLET, amount: '50000000', payload: jettonTransferPayload(2000n) }],
        });

        expect(result.success).toBe(false);
        expect(result.message).toContain('spend limit');
        expect(sendTransaction).not.toHaveBeenCalled();
        // Per-transaction cap -> no rolling window -> no history paging beyond the sync read.
        // (The walletAddressGetMethod mock throws on any method but get_wallet_address, so
        // reaching here already proves no get_wallet_data was issued.)
        expect(getAccountTransactions).toHaveBeenCalledOnce();
    });

    it('allows a within-cap jetton spend metered through the forward map', async () => {
        const sendTransaction = vi.fn().mockResolvedValue({ normalizedHash: 'ok' });
        const service = makeService({
            version: 'agentic',
            getAddress: () => WALLET,
            getClient: () => ({
                getAccountState: vi.fn().mockResolvedValue(agenticAccountState(SERVICE_LIMITS_HASH)),
                getAccountTransactions: vi.fn().mockResolvedValue(limitsChangeResponse(SERVICE_LIMITS_DICT)),
                runGetMethod: walletAddressGetMethod(new Address(0, Buffer.alloc(32, 3))),
            }),
            sendTransaction,
        });

        const result = await service.sendRawTransaction({
            messages: [{ address: JETTON_WALLET, amount: '50000000', payload: jettonTransferPayload(500n) }],
        });

        expect(result.success).toBe(true);
        expect(sendTransaction).toHaveBeenCalledOnce();
    });

    it('meters from the cached forward map on a hash hit with zero metering RPC', async () => {
        const sendTransaction = vi.fn().mockResolvedValue({ normalizedHash: 'ok' });
        const getAccountTransactions = vi.fn();
        const runGetMethod = vi.fn();
        const service = makeService(
            {
                version: 'agentic',
                getAddress: () => WALLET,
                getClient: () => ({
                    getAccountState: vi.fn().mockResolvedValue(agenticAccountState(SERVICE_LIMITS_HASH)),
                    getAccountTransactions,
                    runGetMethod,
                }),
                sendTransaction,
            },
            {
                read: () => ({
                    limits: SERVICE_LIMITS,
                    limits_hash: SERVICE_LIMITS_HASH,
                    jetton_wallets: SERVICE_FORWARD_MAP,
                }),
                write: vi.fn(async () => {}),
            },
        );

        const result = await service.sendRawTransaction({
            messages: [{ address: JETTON_WALLET, amount: '50000000', payload: jettonTransferPayload(500n) }],
        });

        expect(result.success).toBe(true);
        expect(sendTransaction).toHaveBeenCalledOnce();
        // Cache hit -> no re-sync and no get_wallet_address/get_wallet_data at metering time.
        expect(getAccountTransactions).not.toHaveBeenCalled();
        expect(runGetMethod).not.toHaveBeenCalled();
    });

    it('blocks a jetton send when rolling-window history resolved via the cached map tips it over the cap', async () => {
        const sendTransaction = vi.fn();
        const runGetMethod = vi.fn();
        // A prior outgoing jetton transfer of 700 sitting inside the 1-day window, recovered
        // from account history. `now` is read from the same real clock the service uses, so
        // `now - 100` is comfortably within the 86400s window with sub-second test skew.
        const nowSeconds = Math.floor(Date.now() / 1000);
        const history = {
            transactions: [
                makeTx({
                    now: nowSeconds - 100,
                    outs: [
                        {
                            source: WALLET,
                            destination: JETTON_WALLET,
                            value: '50000000',
                            body: jettonTransferBody(700n),
                        },
                    ],
                }),
            ],
        };
        const getAccountTransactions = vi.fn().mockResolvedValue(history);
        const service = makeService(
            {
                version: 'agentic',
                getAddress: () => WALLET,
                getClient: () => ({
                    getAccountState: vi.fn().mockResolvedValue(agenticAccountState(ROLLING_LIMITS_HASH)),
                    getAccountTransactions,
                    runGetMethod,
                }),
                sendTransaction,
            },
            {
                read: () => ({
                    limits: ROLLING_LIMITS,
                    limits_hash: ROLLING_LIMITS_HASH,
                    jetton_wallets: SERVICE_FORWARD_MAP,
                }),
                write: vi.fn(async () => {}),
            },
        );

        // 700 already spent in-window + 500 pending = 1200 > the 1000 daily cap.
        const result = await service.sendRawTransaction({
            messages: [{ address: JETTON_WALLET, amount: '50000000', payload: jettonTransferPayload(500n) }],
        });

        expect(result.success).toBe(false);
        expect(result.message).toContain('spend limit');
        expect(sendTransaction).not.toHaveBeenCalled();
        // The whole history->master->window->violation seam ran through the cached forward
        // map: history was paged, but no jetton-wallet RPC (get_wallet_address/get_wallet_data).
        expect(getAccountTransactions).toHaveBeenCalled();
        expect(runGetMethod).not.toHaveBeenCalled();
    });
});
