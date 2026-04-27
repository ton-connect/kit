/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { z } from 'zod';

export type LimitAsset = { kind: 'ton' } | { kind: 'jetton'; masterAddress: string };

export interface WindowSpend {
    spent: string;
    windowStartMs?: number;
}

export interface AssetSpendState {
    /** Keyed by `String(windowMs)`. Each entry is an independent rolling window. */
    windows: Record<string, WindowSpend>;
}

export interface LimitsState {
    ton?: AssetSpendState;
    jettons: Record<string, AssetSpendState>;
}

export interface WindowedCap {
    windowMs: number;
    max: bigint;
}

export interface AssetLimit {
    perTx: bigint;
    windows: WindowedCap[];
}

export interface JettonLimit extends AssetLimit {
    masterAddress: string;
    decimals: number;
    symbol?: string;
}

export interface NormalizedLimits {
    ton?: AssetLimit;
    jettons?: Map<string, JettonLimit>;
}

export interface ReservationToken {
    id: string;
    asset: LimitAsset;
    amount: bigint;
    /** Window durations (ms) of every cap the commit must update for this asset. */
    windowsMs: number[];
}

export const assetKey = (asset: LimitAsset): string => (asset.kind === 'ton' ? 'ton' : `jetton:${asset.masterAddress}`);

export const windowKey = (windowMs: number): string => String(windowMs);

const decimalKeyRegex = /^\d+$/u;

const windowSpendStateSchema = z
    .object({
        spent: z.string().regex(decimalKeyRegex, 'spent must be a non-negative decimal string'),
        windowStartMs: z.number().nonnegative().optional(),
    })
    .strict();

const assetSpendStateSchema = z
    .object({
        windows: z
            .record(
                z.string().regex(decimalKeyRegex, 'window key must be a decimal millisecond string'),
                windowSpendStateSchema,
            )
            .default({}),
    })
    .strict();

export const limitsStateSchema = z
    .object({
        ton: assetSpendStateSchema.optional(),
        jettons: z.record(z.string(), assetSpendStateSchema).default({}),
    })
    .strict();

export class LimitsStateCorruptError extends Error {
    readonly code = 'LIMITS_STATE_CORRUPT' as const;
    constructor(readonly issue: string) {
        super(`Persisted limits_state is corrupt; refusing to load: ${issue}`);
        this.name = 'LimitsStateCorruptError';
    }
}

// Refuse to load when persisted state fails the schema: silently zeroing
// accumulated spend on disk corruption would grant a fresh window's budget.
export function parseLimitsState(raw: unknown): LimitsState {
    const parsed = limitsStateSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
    throw new LimitsStateCorruptError(parsed.error.message);
}

const decimalString = (fieldName: string) =>
    z.string().regex(/^[0-9]+(\.[0-9]+)?$/u, `${fieldName} must be a non-negative decimal string`);

const windowSchema = z.union([
    z.number().positive(),
    z
        .string()
        .regex(
            /^\s*\d+\s*(s|m|h|d)?\s*$/u,
            'window must look like "30s", "5m", "2h", "1d", or a positive number of seconds',
        ),
]);

const windowedCapSchema = z
    .object({
        window: windowSchema,
        max: decimalString('max'),
    })
    .strict();

const tonLimitSchema = z
    .object({
        per_tx: decimalString('per_tx'),
        limits: z.array(windowedCapSchema).min(1, 'ton.limits must contain at least one entry'),
    })
    .strict();

const jettonLimitSchema = z
    .object({
        master_address: z.string().min(1, 'master_address must be a non-empty TON address'),
        decimals: z.number().int().min(0).max(255),
        symbol: z.string().min(1).optional(),
        per_tx: decimalString('per_tx'),
        limits: z.array(windowedCapSchema).min(1, 'jettons[].limits must contain at least one entry'),
    })
    .strict();

export const limitsFileSchema = z
    .object({
        version: z.literal(1),
        ton: tonLimitSchema.optional(),
        jettons: z.array(jettonLimitSchema).optional(),
    })
    .strict()
    .refine((v) => v.ton !== undefined || (v.jettons !== undefined && v.jettons.length > 0), {
        message: 'limits.json must define "ton" or at least one entry in "jettons"',
    });

export type LimitsFile = z.infer<typeof limitsFileSchema>;

export interface LimitExceededDetails {
    asset: { kind: 'ton' } | { kind: 'jetton'; master_address: string };
    kind: 'per_tx' | 'window';
    limit: string;
    requested: string;
    spent?: string;
    remaining?: string;
    window_ms?: number;
    window_resets_at_ms?: number;
}

export class LimitExceededError extends Error {
    readonly code = 'LIMIT_EXCEEDED' as const;
    constructor(readonly details: LimitExceededDetails) {
        super(
            `Limit exceeded: ${details.kind} for ${
                details.asset.kind === 'ton' ? 'TON' : `jetton ${details.asset.master_address}`
            } (requested=${details.requested}, limit=${details.limit})`,
        );
    }
    toWireObject(): Record<string, unknown> {
        return { code: this.code, ...this.details };
    }
}

export interface LimitsConfigIssue {
    path: string;
    code: string;
    message: string;
}

export class LimitsConfigInvalidError extends Error {
    readonly code = 'LIMITS_CONFIG_INVALID' as const;
    constructor(readonly issues: LimitsConfigIssue[]) {
        super('limits.json is invalid');
    }
    toWireObject(): Record<string, unknown> {
        return { code: this.code, issues: this.issues };
    }
}

const WINDOW_UNIT_MS: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
};

export function parseWindowToMs(input: string | number): number {
    if (typeof input === 'number') {
        if (!(input > 0)) throw new Error(`invalid window: ${input}`);
        return Math.floor(input * 1000);
    }
    const match = /^\s*(\d+)\s*(s|m|h|d)?\s*$/u.exec(input);
    const n = match ? Number.parseInt(match[1]!, 10) : 0;
    if (n <= 0) throw new Error(`invalid window: "${input}"`);
    return n * WINDOW_UNIT_MS[match![2] ?? 's']!;
}
