/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CacheStorage } from './common';

export type RetryFn = (failureCount: number, error?: unknown) => boolean;
export type Retry = boolean | number | RetryFn;
export type RetryDelayFn = (invocationCount: number) => number;
export type RetryDelay = number | RetryDelayFn;

export interface Config {
    storage: CacheStorage;
    minTimeToStale?: number;
    maxTimeToLive?: number;
    retry?: Retry;
    retryDelay?: RetryDelay;
    serialize?: (value: unknown) => unknown;
    deserialize?: (value: unknown) => unknown;
}

export interface ParsedConfig {
    storage: CacheStorage;
    minTimeToStale: number;
    maxTimeToLive: number;
    retry: RetryFn;
    retryDelay: RetryDelayFn;
    serialize: (value: unknown) => unknown;
    deserialize: (value: unknown) => unknown;
}
