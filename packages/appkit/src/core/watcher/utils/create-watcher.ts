/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../app-kit';
import type { WatcherOptions } from '../types';

export type CreateWatcherOptions<TData = unknown> = Partial<Omit<WatcherOptions<TData>, 'watcherKey' | 'watcherFn'>> & {
    onChange?: (data: TData) => void;
};

export type WatcherFactory<TParams, TData> = (appKit: AppKit, params: TParams) => WatcherOptions<TData>;

export type WatcherSubscription = () => void;

export function createWatcher<TParams, TData>(optionsFactory: WatcherFactory<TParams, TData>) {
    return (appKit: AppKit, params: TParams, options: CreateWatcherOptions<TData> = {}): WatcherSubscription => {
        const baseOptions = optionsFactory(appKit, params);

        if (options.enabled === false) {
            return () => {};
        }

        const watcherKey =
            typeof baseOptions.watcherKey === 'string'
                ? baseOptions.watcherKey
                : JSON.stringify(baseOptions.watcherKey);

        let fetcher = undefined;
        if (baseOptions.watcherFn) {
            fetcher = async () => {
                return baseOptions.watcherFn!({ watcherKey: baseOptions.watcherKey, signal: undefined });
            };
        }

        const { unsubscribe } = appKit.swr.subscribe<TData>(
            watcherKey,
            (data) => {
                options.onChange?.(data);
            },
            undefined,
            {
                fetcher,
            },
        );

        if (baseOptions.watcherFn) {
            appKit.swr
                .revalidate(watcherKey, {
                    fetcher,
                })
                .catch((e) => {
                    console.error('Watcher revalidate failed', e);
                });
        }

        const cached = appKit.swr.get(watcherKey);
        if (cached !== undefined) {
            options.onChange?.(cached);
        }

        return unsubscribe;
    };
}
