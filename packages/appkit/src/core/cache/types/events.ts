/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export type CacheEventMap = {
    CACHE_HIT: { cacheKey: string; cachedValue: unknown };
    CACHE_MISS: { cacheKey: string; fn: () => unknown };
    CACHE_STALE: { cacheKey: string; cachedValue: unknown; cachedAge: number };
    CACHE_EXPIRED: {
        cacheKey: string;
        cachedValue: unknown;
        cachedAge: number;
        cachedAt: number;
        maxTimeToLive: number;
    };
    CACHE_GET_FAILED: { cacheKey: string; error: unknown };
    CACHE_REMOVE_FAILED: { cacheKey: string; error: unknown };
    CACHE_SET_FAILED: { cacheKey: string; error: unknown };
    CACHE_UPDATED: { cacheKey: string; cacheValue: unknown };
    CACHE_IN_FLIGHT: { key: string; cacheKey: string };
    CACHE_IN_FLIGHT_SETTLED: { cacheKey: string; key: string };
    INVOKE: { cacheKey: string; fn: () => unknown };
    REVALIDATE: { cacheKey: string; fn: () => unknown };
    REVALIDATE_FAILED: { cacheKey: string; fn: () => unknown; error: unknown };
};
