/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { LimitExceededError, windowKey } from './types.js';
import type {
    AssetLimit,
    AssetSpendState,
    LimitAsset,
    LimitsState,
    NormalizedLimits,
    WindowSpend,
    WindowedCap,
} from './types.js';

export function createEmptyState(): LimitsState {
    return { jettons: {} };
}

function getAssetSpendState(state: LimitsState, asset: LimitAsset): AssetSpendState | undefined {
    return asset.kind === 'ton' ? state.ton : state.jettons[asset.masterAddress];
}

function setAssetSpendState(state: LimitsState, asset: LimitAsset, value: AssetSpendState): LimitsState {
    if (asset.kind === 'ton') {
        return { ...state, ton: value };
    }
    return { ...state, jettons: { ...state.jettons, [asset.masterAddress]: value } };
}

// Windows are session-anchored — they reset only when activity crosses windowStart + windowMs.
export function rolloverWindow(spend: WindowSpend | undefined, windowMs: number, now: number): WindowSpend {
    const current: WindowSpend = spend ?? { spent: '0' };
    if (current.windowStartMs !== undefined && now >= current.windowStartMs + windowMs) {
        return { spent: '0' };
    }
    return current;
}

export function getAssetLimit(asset: LimitAsset, limits: NormalizedLimits): AssetLimit | undefined {
    return asset.kind === 'ton' ? limits.ton : limits.jettons?.get(asset.masterAddress);
}

function assetForError(asset: LimitAsset): { kind: 'ton' } | { kind: 'jetton'; master_address: string } {
    return asset.kind === 'ton' ? { kind: 'ton' } : { kind: 'jetton', master_address: asset.masterAddress };
}

export function checkPerTx(asset: LimitAsset, requested: bigint, limits: NormalizedLimits): LimitExceededError | null {
    const limit = getAssetLimit(asset, limits);
    if (!limit) return null;
    if (requested > limit.perTx) {
        return new LimitExceededError({
            asset: assetForError(asset),
            kind: 'per_tx',
            limit: limit.perTx.toString(),
            requested: requested.toString(),
        });
    }
    return null;
}

// `extraSpend` is for in-flight reservations not yet committed to state.
export function checkWindows(
    asset: LimitAsset,
    requested: bigint,
    limits: NormalizedLimits,
    state: LimitsState,
    now: number,
    extraSpend: bigint = 0n,
): LimitExceededError | null {
    const limit = getAssetLimit(asset, limits);
    if (!limit) return null;
    const spendState = getAssetSpendState(state, asset);
    for (const window of limit.windows) {
        const rolled = rolloverWindow(spendState?.windows[windowKey(window.windowMs)], window.windowMs, now);
        const spent = BigInt(rolled.spent) + extraSpend;
        if (spent + requested > window.max) {
            return new LimitExceededError({
                asset: assetForError(asset),
                kind: 'window',
                window_ms: window.windowMs,
                limit: window.max.toString(),
                requested: requested.toString(),
                spent: spent.toString(),
                remaining: (window.max - spent).toString(),
                ...(rolled.windowStartMs !== undefined
                    ? { window_resets_at_ms: rolled.windowStartMs + window.windowMs }
                    : {}),
            });
        }
    }
    return null;
}

export function applySpend(
    asset: LimitAsset,
    amount: bigint,
    windowsMs: number[],
    state: LimitsState,
    now: number,
): LimitsState {
    if (windowsMs.length === 0) return state;
    const existing = getAssetSpendState(state, asset);
    // Only retain keys for currently configured windows; any other keys in
    // `existing.windows` were left over from a prior config and are stale.
    const nextWindows: Record<string, WindowSpend> = {};
    for (const windowMs of windowsMs) {
        const key = windowKey(windowMs);
        const rolled = rolloverWindow(existing?.windows[key], windowMs, now);
        const newSpent = BigInt(rolled.spent) + amount;
        const newWindowStart = rolled.windowStartMs ?? now;
        nextWindows[key] = { spent: newSpent.toString(), windowStartMs: newWindowStart };
    }
    return setAssetSpendState(state, asset, { windows: nextWindows });
}

export function viewAssetSpend(
    asset: LimitAsset,
    limits: NormalizedLimits | null,
    state: LimitsState,
    now: number,
): Array<{ windowMs: number; spend: WindowSpend; cap?: WindowedCap }> | null {
    const limit = limits ? getAssetLimit(asset, limits) : undefined;
    const spendState = getAssetSpendState(state, asset);
    if (!limit && !spendState) return null;
    const seen = new Set<string>();
    const out: Array<{ windowMs: number; spend: WindowSpend; cap?: WindowedCap }> = [];
    if (limit) {
        for (const window of limit.windows) {
            const key = windowKey(window.windowMs);
            seen.add(key);
            out.push({
                windowMs: window.windowMs,
                spend: rolloverWindow(spendState?.windows[key], window.windowMs, now),
                cap: window,
            });
        }
    }
    if (spendState) {
        for (const [key, raw] of Object.entries(spendState.windows)) {
            if (seen.has(key)) continue;
            out.push({ windowMs: Number(key), spend: raw });
        }
    }
    return out;
}
