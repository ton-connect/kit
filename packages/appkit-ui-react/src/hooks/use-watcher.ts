/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useState } from 'react';
import type { AppKit, WatcherOptions, CacheEventMap, CacheResponse, AppKitEvent } from '@ton/appkit';
import { EmitterEvents } from '@ton/appkit';

import { useAppKit } from './use-app-kit';

export type WatcherFactory<TParams, TData> = (appKit: AppKit, params: TParams) => WatcherOptions<TData>;

export interface UseWatcherResult<TData> {
    data: TData | undefined;
    isLoading: boolean;
    error: unknown | undefined;
    isFetching: boolean;
}

/**
 * Generic hook for watchers
 */
export function useWatcher<TParams, TData>(
    watcherFactory: WatcherFactory<TParams, TData>,
    params: TParams,
    overrides?: Partial<WatcherOptions<TData>>,
): UseWatcherResult<TData> {
    const appKit = useAppKit();
    const factoryOptions = watcherFactory(appKit, params);

    // Merge factory options with overrides
    // We deep merge or shallow merge? Shallow merge of top level props.
    // If retry is object, we might want to be careful. But for now shallow is enough.
    // However, watcherKey must assume factory one usually. Overrides shouldn't change key easily.
    const options: WatcherOptions<TData> = { ...factoryOptions, ...overrides };

    // Stable serialization of params/key to avoid infinite loops if factory creates new object every time
    // But we use options.watcherKey for cache interaction.
    // However, if other options change (like staleTime), we might want to know.
    // For now, assume parameters change drives options change.

    // Implementation using useEffect and useState
    const [state, setState] = useState<UseWatcherResult<TData>>({
        data: options.initialData,
        isLoading: true, // Initially loading until we verify cache
        error: undefined,
        isFetching: true,
    });

    useEffect(() => {
        let isMounted = true;
        const key = getCacheKey(options.watcherKey);

        const fetchData = async () => {
            if (options.enabled === false) {
                return;
            }

            setState((prev) => ({ ...prev, isFetching: true }));

            try {
                if (!options.watcherFn) {
                    // Logic when no watcherFn is provided - perhaps just peek?
                    // For now, if no watcherFn, we can't 'get' (fetch) data.
                    // We could assume data might be there.
                    const cached = await appKit.cache.peek<TData>(options.watcherKey);
                    if (isMounted) {
                        setState((prev) => ({
                            ...prev,
                            data: cached.cachedValue ?? undefined,
                            isLoading: false,
                            isFetching: false,
                            error: undefined,
                        }));
                    }
                    return;
                }

                const response = await appKit.cache.get(
                    options.watcherKey,
                    () => options.watcherFn!({ watcherKey: options.watcherKey }),
                    {
                        minTimeToStale: options.staleTime,
                        maxTimeToLive: options.cacheTime,
                        retry: options.retry,
                        retryDelay: options.retryDelay,
                    },
                );

                if (isMounted) {
                    setState((prev) => ({
                        ...prev,
                        data: response.value,
                        isLoading: false,
                        error: undefined,
                        isFetching: false,
                    }));
                }
            } catch (err) {
                if (isMounted) {
                    setState((prev) => ({
                        ...prev,
                        isLoading: false,
                        isFetching: false,
                        error: err,
                    }));
                }
            }
        };

        fetchData();

        // Subscription for updates (e.g. background revalidation finished, or polling)
        const onCacheUpdate = (event: AppKitEvent<CacheEventMap['CACHE_UPDATED']>) => {
            const eventKey = event.payload.cacheKey;
            if (eventKey === key) {
                const value = event.payload.cacheValue;
                if (value !== undefined) {
                    setState((prev) => ({
                        ...prev,
                        data: value as TData,
                        isFetching: false, // Update received
                        error: undefined,
                    }));
                }
            }
        };

        const unsub = appKit.cache.emitter.on(EmitterEvents.CACHE_UPDATED, onCacheUpdate);

        const onRevalidate = (event: AppKitEvent<CacheEventMap['REVALIDATE']>) => {
            if (event.payload.cacheKey === key) {
                setState((prev) => ({ ...prev, isFetching: true }));
            }
        };
        const unsubRevalidate = appKit.cache.emitter.on(EmitterEvents.REVALIDATE, onRevalidate);

        return () => {
            isMounted = false;
            unsub();
            unsubRevalidate();
        };
    }, [appKit, JSON.stringify(options.watcherKey), options.enabled]);

    useEffect(() => {
        if (!options.refetchInterval || options.enabled === false || !options.watcherFn) return;

        const interval = setInterval(() => {
            if (!options.watcherFn) return;

            appKit.cache
                .get(options.watcherKey, () => options.watcherFn!({ watcherKey: options.watcherKey }), {
                    minTimeToStale: 0,
                })
                .then((res: CacheResponse<TData>) => {
                    setState((prev) => ({ ...prev, data: res.value }));
                });
        }, options.refetchInterval);

        return () => clearInterval(interval);
    }, [options.refetchInterval, options.enabled, JSON.stringify(options.watcherKey)]);

    return state;
}

// Helper to stringify key
function getCacheKey(key: any): string {
    if (typeof key === 'string') return key;
    if (Array.isArray(key)) return key.join('-');
    return JSON.stringify(key);
}
