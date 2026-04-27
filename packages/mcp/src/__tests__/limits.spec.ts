/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { beginCell } from '@ton/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AsyncLock } from '../limits/async-lock.js';
import {
    applySpend,
    checkPerTx,
    checkWindows,
    createEmptyState,
    getAssetLimit,
    rolloverWindow,
    viewAssetSpend,
} from '../limits/enforcer.js';
import { loadLimits } from '../limits/loader.js';
import { parseJettonOutflowAmount } from '../limits/parse-message.js';
import { LimitsStore } from '../limits/store.js';
import {
    LimitExceededError,
    LimitsConfigInvalidError,
    LimitsStateCorruptError,
    parseLimitsState,
    parseWindowToMs,
    windowKey,
} from '../limits/types.js';
import type { LimitAsset, LimitsState, NormalizedLimits } from '../limits/types.js';
import { toLimitsConfigView } from '../limits/views.js';

// EQ-form zero address; normalizes to a canonical raw form via the loader.
const ZERO_ADDRESS = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
// Distinct jetton master used to verify per-asset isolation.
const ALT_JETTON = 'EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE';

const TON: LimitAsset = { kind: 'ton' };

function buildTonLimits(perTx: bigint, windows: Array<{ windowMs: number; max: bigint }>): NormalizedLimits {
    return { ton: { perTx, windows } };
}

describe('limits/types: parseWindowToMs', () => {
    it('parses unit suffixes', () => {
        expect(parseWindowToMs('30s')).toBe(30_000);
        expect(parseWindowToMs('5m')).toBe(300_000);
        expect(parseWindowToMs('2h')).toBe(7_200_000);
        expect(parseWindowToMs('1d')).toBe(86_400_000);
    });

    it('treats bare numbers as seconds', () => {
        expect(parseWindowToMs('45')).toBe(45_000);
        expect(parseWindowToMs(45)).toBe(45_000);
    });

    it('rejects non-positive or malformed input', () => {
        expect(() => parseWindowToMs(0)).toThrow();
        expect(() => parseWindowToMs(-1)).toThrow();
        expect(() => parseWindowToMs('1y')).toThrow();
        expect(() => parseWindowToMs('')).toThrow();
    });
});

describe('limits/types: parseLimitsState (fail-closed)', () => {
    it('accepts a valid persisted state', () => {
        const state = parseLimitsState({
            jettons: {},
            ton: { windows: { '60000': { spent: '500', windowStartMs: 1000 } } },
        });
        expect(state.ton?.windows['60000']?.spent).toBe('500');
    });

    // Silently treating corrupt persisted state as empty would refresh the spend
    // counter to zero and grant a fresh window's worth of budget.
    it('throws LimitsStateCorruptError on a malformed shape', () => {
        expect(() => parseLimitsState({ not: 'a valid limits_state shape' })).toThrow(LimitsStateCorruptError);
    });

    it('rejects negative or non-decimal spent values', () => {
        expect(() =>
            parseLimitsState({
                jettons: {},
                ton: { windows: { '60000': { spent: '-1' } } },
            }),
        ).toThrow(LimitsStateCorruptError);
        expect(() =>
            parseLimitsState({
                jettons: {},
                ton: { windows: { '60000': { spent: 'NaN' } } },
            }),
        ).toThrow(LimitsStateCorruptError);
    });
});

describe('limits/types: error wire payloads', () => {
    it('LimitExceededError includes code and details on the wire', () => {
        const err = new LimitExceededError({
            asset: { kind: 'ton' },
            kind: 'window',
            limit: '100',
            requested: '150',
            spent: '60',
            remaining: '40',
            window_ms: 60_000,
        });
        expect(err.code).toBe('LIMIT_EXCEEDED');
        expect(err.toWireObject()).toMatchObject({
            code: 'LIMIT_EXCEEDED',
            kind: 'window',
            requested: '150',
            limit: '100',
            window_ms: 60_000,
        });
    });

    it('LimitsConfigInvalidError exposes structured issues', () => {
        const err = new LimitsConfigInvalidError([{ path: 'ton.per_tx', code: 'invalid_value', message: 'bad' }]);
        expect(err.code).toBe('LIMITS_CONFIG_INVALID');
        expect(err.toWireObject()).toEqual({
            code: 'LIMITS_CONFIG_INVALID',
            issues: [{ path: 'ton.per_tx', code: 'invalid_value', message: 'bad' }],
        });
    });
});

describe('limits/enforcer: checkPerTx', () => {
    const limits = buildTonLimits(1_000n, [{ windowMs: 60_000, max: 10_000n }]);

    it('returns null when amount equals per_tx (boundary inclusive)', () => {
        expect(checkPerTx(TON, 1_000n, limits)).toBeNull();
    });

    it('returns LimitExceededError when amount strictly exceeds per_tx', () => {
        const err = checkPerTx(TON, 1_001n, limits);
        expect(err).toBeInstanceOf(LimitExceededError);
        expect(err?.details.kind).toBe('per_tx');
        expect(err?.details.limit).toBe('1000');
        expect(err?.details.requested).toBe('1001');
    });

    it('returns null when the asset is not configured at all', () => {
        // Unknown asset must not block — limits are opt-in per asset.
        expect(checkPerTx({ kind: 'jetton', masterAddress: 'EQUnknownXYZ' }, 1_000_000n, limits)).toBeNull();
    });
});

describe('limits/enforcer: checkWindows + extraSpend', () => {
    const limits = buildTonLimits(1_000n, [{ windowMs: 60_000, max: 100n }]);
    const state: LimitsState = createEmptyState();

    it('admits exactly up to the cap', () => {
        expect(checkWindows(TON, 100n, limits, state, 0)).toBeNull();
    });

    it('rejects when in-flight reservations push the request past the cap', () => {
        // 60 already spent + 30 in-flight + 30 requested = 120 > 100.
        const seeded = applySpend(TON, 60n, [60_000], state, 1_000);
        const err = checkWindows(TON, 30n, limits, seeded, 1_500, /* extraSpend */ 30n);
        expect(err).toBeInstanceOf(LimitExceededError);
        expect(err?.details.kind).toBe('window');
        expect(err?.details.spent).toBe('90');
        expect(err?.details.remaining).toBe('10');
    });
});

describe('limits/enforcer: rolloverWindow', () => {
    it('keeps the spend record while the window is still active', () => {
        const rolled = rolloverWindow({ spent: '500', windowStartMs: 1_000 }, 60_000, 30_000);
        expect(rolled.spent).toBe('500');
        expect(rolled.windowStartMs).toBe(1_000);
    });

    it('zeroes the spend when current time has passed windowStart + windowMs', () => {
        // Boundary: now == start + window must already roll over (>=).
        const rolled = rolloverWindow({ spent: '500', windowStartMs: 1_000 }, 60_000, 61_000);
        expect(rolled).toEqual({ spent: '0' });
    });

    it('returns a fresh record when no prior spend exists', () => {
        expect(rolloverWindow(undefined, 60_000, 0)).toEqual({ spent: '0' });
    });
});

describe('limits/enforcer: applySpend', () => {
    it('seeds windowStartMs on first spend and accumulates within the window', () => {
        let s = createEmptyState();
        s = applySpend(TON, 100n, [60_000], s, 5_000);
        expect(s.ton?.windows['60000']).toEqual({ spent: '100', windowStartMs: 5_000 });
        s = applySpend(TON, 50n, [60_000], s, 30_000);
        expect(s.ton?.windows['60000']).toEqual({ spent: '150', windowStartMs: 5_000 });
    });

    // Critical: keeping stale window entries from a previous configuration would
    // either bloat persisted state or, worse, let removed windows shadow the
    // active ones in unrelated views.
    it('drops keys for windows no longer in the active configuration', () => {
        let s = createEmptyState();
        s = applySpend(TON, 10n, [60_000], s, 0);
        s = applySpend(TON, 5n, [3_600_000], s, 0);
        // After applying spend with only the hour window, the minute window must be gone.
        const keys = Object.keys(s.ton!.windows);
        expect(keys).toEqual(['3600000']);
    });

    it('keeps assets isolated from one another', () => {
        let s = createEmptyState();
        s = applySpend(TON, 10n, [60_000], s, 0);
        s = applySpend({ kind: 'jetton', masterAddress: ZERO_ADDRESS }, 7n, [60_000], s, 0);
        expect(s.ton?.windows['60000']?.spent).toBe('10');
        expect(s.jettons[ZERO_ADDRESS]?.windows['60000']?.spent).toBe('7');
    });
});

describe('limits/enforcer: viewAssetSpend + getAssetLimit', () => {
    it('returns null when neither limits nor state mention the asset', () => {
        expect(viewAssetSpend({ kind: 'jetton', masterAddress: 'X' }, null, createEmptyState(), 0)).toBeNull();
    });

    it('exposes configured caps even when the asset has no spend yet', () => {
        const limits = buildTonLimits(100n, [{ windowMs: 60_000, max: 1_000n }]);
        const view = viewAssetSpend(TON, limits, createEmptyState(), 0);
        expect(view).toEqual([
            {
                windowMs: 60_000,
                spend: { spent: '0' },
                cap: { windowMs: 60_000, max: 1_000n },
            },
        ]);
    });

    it('also surfaces orphan windows present in state but absent from config', () => {
        let state = createEmptyState();
        state = applySpend(TON, 10n, [60_000], state, 0);
        const view = viewAssetSpend(TON, { ton: { perTx: 100n, windows: [] } }, state, 0);
        // Orphan key must still be reported so the operator can see lingering spend.
        expect(view).toHaveLength(1);
        expect(view?.[0]?.cap).toBeUndefined();
        expect(view?.[0]?.spend.spent).toBe('10');
    });

    it('getAssetLimit looks up jetton limits by master address', () => {
        const limits: NormalizedLimits = {
            jettons: new Map([[ZERO_ADDRESS, { masterAddress: ZERO_ADDRESS, decimals: 9, perTx: 1n, windows: [] }]]),
        };
        expect(getAssetLimit({ kind: 'jetton', masterAddress: ZERO_ADDRESS }, limits)?.perTx).toBe(1n);
        expect(getAssetLimit({ kind: 'jetton', masterAddress: 'EQOther' }, limits)).toBeUndefined();
    });
});

describe('limits/loader: loadLimits', () => {
    let dir = '';
    let path = '';

    beforeEach(() => {
        dir = mkdtempSync(join(tmpdir(), 'ton-mcp-limits-'));
        path = join(dir, 'limits.json');
    });

    afterEach(() => {
        rmSync(dir, { recursive: true, force: true });
    });

    it('returns configured:false when the file is missing', () => {
        const result = loadLimits(join(dir, 'does-not-exist.json'));
        expect(result).toEqual({ configured: false });
    });

    it('parses a valid TON-only config and converts to base units', () => {
        writeFileSync(
            path,
            JSON.stringify({
                version: 1,
                ton: {
                    per_tx: '1.5',
                    limits: [{ window: '1h', max: '10' }],
                },
            }),
        );
        const result = loadLimits(path);
        expect('limits' in result && result.limits.ton).toBeDefined();
        if (!('limits' in result) || !result.limits.ton) throw new Error('expected limits');
        expect(result.limits.ton.perTx).toBe(1_500_000_000n); // 1.5 TON in nanotons
        expect(result.limits.ton.windows).toEqual([{ windowMs: 3_600_000, max: 10_000_000_000n }]);
    });

    it('reports an error when neither ton nor jettons is configured', () => {
        writeFileSync(path, JSON.stringify({ version: 1 }));
        const result = loadLimits(path);
        if (!('error' in result)) throw new Error('expected error');
        expect(result.error).toBeInstanceOf(LimitsConfigInvalidError);
    });

    it('reports an error when max is below per_tx', () => {
        writeFileSync(
            path,
            JSON.stringify({
                version: 1,
                ton: {
                    per_tx: '5',
                    limits: [{ window: '1h', max: '1' }],
                },
            }),
        );
        const result = loadLimits(path);
        if (!('error' in result)) throw new Error('expected error');
        const issues = result.error.issues.map((i) => i.code);
        expect(issues).toContain('custom');
    });

    it('reports an error when the same window is configured twice', () => {
        writeFileSync(
            path,
            JSON.stringify({
                version: 1,
                ton: {
                    per_tx: '1',
                    limits: [
                        { window: '60s', max: '10' },
                        { window: '1m', max: '20' },
                    ],
                },
            }),
        );
        const result = loadLimits(path);
        if (!('error' in result)) throw new Error('expected error');
        expect(result.error.issues.some((i) => i.code === 'duplicate')).toBe(true);
    });

    it('reports an error for a malformed jetton master address', () => {
        writeFileSync(
            path,
            JSON.stringify({
                version: 1,
                jettons: [
                    {
                        master_address: 'not-a-real-address',
                        decimals: 9,
                        per_tx: '1',
                        limits: [{ window: '1h', max: '10' }],
                    },
                ],
            }),
        );
        const result = loadLimits(path);
        if (!('error' in result)) throw new Error('expected error');
        expect(result.error.issues.some((i) => i.code === 'invalid_address')).toBe(true);
    });
});

describe('limits/store: LimitsStore', () => {
    function makeStore(initialState: LimitsState | null = null) {
        const persisted: LimitsState[] = [];
        const store = new LimitsStore({
            initialState,
            persist: async (state) => {
                persisted.push(state);
            },
        });
        return { store, persisted };
    }

    it('aggregates same-asset reservations within one call so per_tx applies to the sum', async () => {
        const { store } = makeStore();
        const limits = buildTonLimits(100n, [{ windowMs: 60_000, max: 10_000n }]);
        // Two TON outputs in the same request: 60 + 50 = 110 > per_tx(100) — must reject.
        await expect(
            store.reserveMany(
                [
                    { asset: TON, amount: 60n },
                    { asset: TON, amount: 50n },
                ],
                limits,
            ),
        ).rejects.toBeInstanceOf(LimitExceededError);
    });

    it('rejects subsequent reservations once in-flight ones consume the window', async () => {
        const { store } = makeStore();
        const limits = buildTonLimits(100n, [{ windowMs: 60_000, max: 100n }]);
        await store.reserveMany([{ asset: TON, amount: 60n }], limits);
        // 60 in-flight + 50 requested = 110 > cap(100). Without in-flight tracking, this
        // would slip through because nothing is committed to state yet.
        await expect(store.reserveMany([{ asset: TON, amount: 50n }], limits)).rejects.toBeInstanceOf(
            LimitExceededError,
        );
    });

    it('commitMany writes spend to state and persists it, then frees the in-flight slot', async () => {
        const { store, persisted } = makeStore();
        const limits = buildTonLimits(100n, [{ windowMs: 60_000, max: 100n }]);
        const tokens = await store.reserveMany([{ asset: TON, amount: 60n }], limits);
        await store.commitMany(tokens);

        expect(persisted).toHaveLength(1);
        expect(persisted[0]?.ton?.windows[windowKey(60_000)]?.spent).toBe('60');

        // Reservation slot is gone — but cap is now consumed via persisted state, so
        // a subsequent 50 should still fail (60 spent + 50 requested = 110 > 100).
        await expect(store.reserveMany([{ asset: TON, amount: 50n }], limits)).rejects.toBeInstanceOf(
            LimitExceededError,
        );
        // ...whereas a 40 fits exactly (60 + 40 = 100).
        await expect(store.reserveMany([{ asset: TON, amount: 40n }], limits)).resolves.toBeDefined();
    });

    it('refundMany clears the in-flight reservation without persisting', async () => {
        const { store, persisted } = makeStore();
        const limits = buildTonLimits(100n, [{ windowMs: 60_000, max: 100n }]);
        const tokens = await store.reserveMany([{ asset: TON, amount: 80n }], limits);
        await store.refundMany(tokens);
        expect(persisted).toHaveLength(0);
        // After refund, the full cap is available again.
        await expect(store.reserveMany([{ asset: TON, amount: 100n }], limits)).resolves.toBeDefined();
    });

    it('keeps the in-memory spend record updated even when persistence throws', async () => {
        // The funds already broadcast on-chain — losing the in-memory record would
        // double-spend the window cap on the very next reservation in this process.
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const store = new LimitsStore({
            initialState: null,
            persist: async () => {
                throw new Error('disk full');
            },
        });
        const limits = buildTonLimits(100n, [{ windowMs: 60_000, max: 100n }]);
        const tokens = await store.reserveMany([{ asset: TON, amount: 80n }], limits);
        await store.commitMany(tokens);
        expect(store.getState().ton?.windows[windowKey(60_000)]?.spent).toBe('80');
        // Cap is now consumed in memory: 80 + 30 = 110 > 100.
        await expect(store.reserveMany([{ asset: TON, amount: 30n }], limits)).rejects.toBeInstanceOf(
            LimitExceededError,
        );
        consoleSpy.mockRestore();
    });

    it('reserveMany skips zero-amount requests rather than minting empty tokens', async () => {
        const { store } = makeStore();
        const limits = buildTonLimits(100n, [{ windowMs: 60_000, max: 100n }]);
        const tokens = await store.reserveMany([{ asset: TON, amount: 0n }], limits);
        expect(tokens).toEqual([]);
    });
});

describe('limits/parse-message: parseJettonOutflowAmount', () => {
    function jettonPayload(op: number, amount: bigint): string {
        return beginCell()
            .storeUint(op, 32)
            .storeUint(0n, 64) // query_id
            .storeCoins(amount)
            .endCell()
            .toBoc()
            .toString('base64');
    }

    it('extracts amount from a jetton transfer (op 0x0f8a7ea5)', () => {
        const payload = jettonPayload(0x0f8a7ea5, 12_345n);
        expect(parseJettonOutflowAmount(payload)).toBe(12_345n);
    });

    it('extracts amount from a jetton burn (op 0x595f07bc)', () => {
        const payload = jettonPayload(0x595f07bc, 999n);
        expect(parseJettonOutflowAmount(payload)).toBe(999n);
    });

    it('returns null for an unrelated op so non-jetton messages are not metered as jetton spend', () => {
        const payload = jettonPayload(0x12345678, 100n);
        expect(parseJettonOutflowAmount(payload)).toBeNull();
    });

    it('returns null on null/empty input', () => {
        expect(parseJettonOutflowAmount(null)).toBeNull();
        expect(parseJettonOutflowAmount(undefined)).toBeNull();
        expect(parseJettonOutflowAmount('')).toBeNull();
    });

    it('returns null on a malformed base64 cell', () => {
        expect(parseJettonOutflowAmount('not-valid-base64-cell-data')).toBeNull();
    });

    it('returns null when there are not enough bits for the header', () => {
        // Header is 32+64=96 bits; this cell is only 32, so the parser must bail.
        const tiny = beginCell().storeUint(0, 32).endCell().toBoc().toString('base64');
        expect(parseJettonOutflowAmount(tiny)).toBeNull();
    });
});

describe('limits/views: toLimitsConfigView', () => {
    it('serializes ton limits with bigints rendered as decimal strings', () => {
        const view = toLimitsConfigView(buildTonLimits(1_000n, [{ windowMs: 60_000, max: 5_000n }]));
        expect(view).toEqual({
            ton: { per_tx: '1000', limits: [{ window_ms: 60_000, max: '5000' }] },
        });
    });

    it('preserves jetton symbol when set and omits it when not', () => {
        const limits: NormalizedLimits = {
            jettons: new Map([
                [ZERO_ADDRESS, { masterAddress: ZERO_ADDRESS, decimals: 9, symbol: 'USDT', perTx: 1n, windows: [] }],
                [ALT_JETTON, { masterAddress: ALT_JETTON, decimals: 6, perTx: 2n, windows: [] }],
            ]),
        };
        const view = toLimitsConfigView(limits);
        expect(view.jettons).toEqual([
            { master_address: ZERO_ADDRESS, decimals: 9, symbol: 'USDT', per_tx: '1', limits: [] },
            { master_address: ALT_JETTON, decimals: 6, per_tx: '2', limits: [] },
        ]);
    });
});

describe('limits/async-lock: AsyncLock', () => {
    it('serializes critical sections so one finishes before the next starts', async () => {
        // Without the lock, two interleaved increments on a shared counter would
        // race on the read; the store relies on this to keep reservations consistent.
        const lock = new AsyncLock();
        let counter = 0;
        const trace: number[] = [];
        const inc = () =>
            lock.runExclusive(async () => {
                const observed = counter;
                await new Promise((r) => setTimeout(r, 5));
                counter = observed + 1;
                trace.push(counter);
            });
        await Promise.all([inc(), inc(), inc()]);
        expect(counter).toBe(3);
        expect(trace).toEqual([1, 2, 3]);
    });
});
