/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export type WatcherKey = string; // swrev prefers string keys. Complex keys can be stringified.

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
}
