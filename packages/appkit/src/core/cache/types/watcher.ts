/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Retry, RetryDelay } from './config';

export type WatcherKey = string | number | (string | number)[];

export interface WatcherContext {
    watcherKey: WatcherKey;
    signal?: AbortSignal;
}

export type WatcherFunction<T = unknown> = (context: WatcherContext) => T | Promise<T>;

export interface WatcherOptions<T = unknown> {
    watcherKey: WatcherKey;
    watcherFn?: WatcherFunction<T>;
    initialData?: T;
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    retry?: Retry;
    retryDelay?: RetryDelay;
    refetchInterval?: number;
}
