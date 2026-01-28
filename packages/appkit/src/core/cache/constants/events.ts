/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const EmitterEvents = {
    CACHE_HIT: 'CACHE_HIT',
    CACHE_MISS: 'CACHE_MISS',
    CACHE_STALE: 'CACHE_STALE',
    CACHE_EXPIRED: 'CACHE_EXPIRED',
    CACHE_GET_FAILED: 'CACHE_GET_FAILED',
    CACHE_REMOVE_FAILED: 'CACHE_REMOVE_FAILED',
    CACHE_SET_FAILED: 'CACHE_SET_FAILED',
    CACHE_UPDATED: 'CACHE_UPDATED',
    CACHE_IN_FLIGHT: 'CACHE_IN_FLIGHT',
    CACHE_IN_FLIGHT_SETTLED: 'CACHE_IN_FLIGHT_SETTLED',
    INVOKE: 'INVOKE',
    REVALIDATE: 'REVALIDATE',
    REVALIDATE_FAILED: 'REVALIDATE_FAILED',
    POLL: 'POLL',
} as const;
