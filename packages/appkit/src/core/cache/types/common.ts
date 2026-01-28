/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CacheStatus as CacheStatusValues } from '../constants/common';

export type CacheStatus = (typeof CacheStatusValues)[keyof typeof CacheStatusValues];

export interface CacheStorage {
    getItem(key: string): unknown | null | Promise<unknown | null>;
    setItem(key: string, value: unknown): void | Promise<void>;
    removeItem?: (key: string) => unknown | null | Promise<unknown | null>;
}

export type CacheKey = string | number | (string | number)[];

export type CacheEntry<CacheValue> = {
    cachedValue: CacheValue | null;
    cachedAge: number;
    cachedAt?: number;
    now: number;
};

export type CacheResponse<CacheValue> = {
    value: CacheValue;
    status: CacheStatus;
    minTimeToStale: number;
    maxTimeToLive: number;
    now: number;
    cachedAt: number;
    expireAt: number;
    staleAt: number;
};
