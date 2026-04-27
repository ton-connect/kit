/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { viewAssetSpend } from './enforcer.js';
import type { LimitAsset, LimitsState, NormalizedLimits, WindowedCap } from './types.js';

export interface LimitsWindowSpendView {
    window_ms: number;
    spent: string;
    max?: string;
    window_started_at_ms?: number;
    window_resets_at_ms?: number;
}

export interface LimitsAssetSpendView {
    windows: LimitsWindowSpendView[];
}

interface LimitsCapView {
    window_ms: number;
    max: string;
}

export interface LimitsConfigView {
    ton?: { per_tx: string; limits: LimitsCapView[] };
    jettons?: Array<{
        master_address: string;
        decimals: number;
        symbol?: string;
        per_tx: string;
        limits: LimitsCapView[];
    }>;
}

export interface LimitsStateView {
    configured: boolean;
    now_ms: number;
    spent: {
        ton?: LimitsAssetSpendView;
        jettons: Record<string, LimitsAssetSpendView>;
    };
    limits: LimitsConfigView | null;
}

export function toLimitsConfigView(limits: NormalizedLimits): LimitsConfigView {
    const caps = (windows: WindowedCap[]): LimitsCapView[] =>
        windows.map((w) => ({ window_ms: w.windowMs, max: w.max.toString() }));
    const view: LimitsConfigView = {};
    if (limits.ton) {
        view.ton = { per_tx: limits.ton.perTx.toString(), limits: caps(limits.ton.windows) };
    }
    if (limits.jettons?.size) {
        view.jettons = [...limits.jettons.values()].map((j) => ({
            master_address: j.masterAddress,
            decimals: j.decimals,
            ...(j.symbol ? { symbol: j.symbol } : {}),
            per_tx: j.perTx.toString(),
            limits: caps(j.windows),
        }));
    }
    return view;
}

export function toLimitsAssetSpendView(
    asset: LimitAsset,
    limits: NormalizedLimits | null,
    state: LimitsState,
    now: number,
): LimitsAssetSpendView | undefined {
    const windows = viewAssetSpend(asset, limits, state, now);
    if (!windows) return undefined;
    return {
        windows: windows.map(({ windowMs, spend, cap }) => ({
            window_ms: windowMs,
            spent: spend.spent,
            max: cap?.max.toString(),
            window_started_at_ms: spend.windowStartMs,
            window_resets_at_ms: spend.windowStartMs !== undefined ? spend.windowStartMs + windowMs : undefined,
        })),
    };
}
