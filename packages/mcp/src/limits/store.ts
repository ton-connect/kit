/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { randomUUID } from 'node:crypto';

import { AsyncLock } from './async-lock.js';
import { applySpend, checkPerTx, checkWindows, createEmptyState, getAssetLimit } from './enforcer.js';
import { assetKey } from './types.js';
import type { LimitAsset, LimitsState, NormalizedLimits, ReservationToken } from './types.js';

export interface LimitsStoreOpts {
    initialState?: LimitsState | null;
    persist: (state: LimitsState) => Promise<void>;
}

export interface ReservationRequest {
    asset: LimitAsset;
    amount: bigint;
}

export class LimitsStore {
    private readonly lock = new AsyncLock();
    private readonly reservations = new Map<string, { asset: LimitAsset; amount: bigint }>();
    private state: LimitsState;

    constructor(private readonly opts: LimitsStoreOpts) {
        this.state = opts.initialState ?? createEmptyState();
    }

    getState(): LimitsState {
        return this.state;
    }

    private inFlight(asset: LimitAsset): bigint {
        let sum = 0n;
        const key = assetKey(asset);
        for (const res of this.reservations.values()) {
            if (assetKey(res.asset) === key) sum += res.amount;
        }
        return sum;
    }

    async reserveMany(requests: ReservationRequest[], limits: NormalizedLimits): Promise<ReservationToken[]> {
        return this.lock.runExclusive(() => {
            const now = Date.now();
            const state = this.getState();

            const aggregated = new Map<string, ReservationRequest>();
            for (const req of requests) {
                if (req.amount <= 0n) continue;
                const key = assetKey(req.asset);
                const existing = aggregated.get(key);
                if (existing) {
                    existing.amount += req.amount;
                } else {
                    aggregated.set(key, { asset: req.asset, amount: req.amount });
                }
            }

            for (const { asset, amount } of aggregated.values()) {
                const err = checkPerTx(asset, amount, limits);
                if (err) throw err;
            }

            for (const { asset, amount } of aggregated.values()) {
                const err = checkWindows(asset, amount, limits, state, now, this.inFlight(asset));
                if (err) throw err;
            }

            const tokens: ReservationToken[] = [];
            for (const { asset, amount } of aggregated.values()) {
                const limit = getAssetLimit(asset, limits);
                const windowsMs = limit ? limit.windows.map((w) => w.windowMs) : [];
                const token: ReservationToken = { id: randomUUID(), asset, amount, windowsMs };
                this.reservations.set(token.id, { asset, amount });
                tokens.push(token);
            }
            return tokens;
        });
    }

    async commitMany(tokens: ReservationToken[]): Promise<void> {
        if (tokens.length === 0) return;
        await this.lock.runExclusive(async () => {
            const now = Date.now();
            let next = this.state;
            let mutated = false;
            for (const token of tokens) {
                this.reservations.delete(token.id);
                if (token.windowsMs.length === 0) continue;
                next = applySpend(token.asset, token.amount, token.windowsMs, next, now);
                mutated = true;
            }
            if (!mutated) return;
            // In-memory first: the funds already moved on-chain, so the spend record must be
            // accurate for subsequent requests in this process even if disk persistence fails.
            this.state = next;
            try {
                await this.opts.persist(next);
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error(
                    JSON.stringify({
                        code: 'LIMIT_STATE_PERSIST_FAILED',
                        assets: tokens.map((t) => ({ asset: t.asset, amount: t.amount.toString() })),
                        error: err instanceof Error ? err.message : String(err),
                    }),
                );
            }
        });
    }

    async refundMany(tokens: ReservationToken[]): Promise<void> {
        if (tokens.length === 0) return;
        await this.lock.runExclusive(() => {
            for (const token of tokens) this.reservations.delete(token.id);
        });
    }
}
