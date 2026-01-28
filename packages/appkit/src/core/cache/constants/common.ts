/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const CacheStatus = {
    FRESH: 'fresh',
    STALE: 'stale',
    EXPIRED: 'expired',
    MISS: 'miss',
} as const;

export const RetryDefaults = {
    MIN_MS: 1000,
    MAX_MS: 30000,
};
