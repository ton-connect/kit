/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useState } from 'react';
import type { AppKit, CreateWatcherOptions, WatcherSubscription } from '@ton/appkit';

import { useAppKit } from './use-app-kit';

export type UseWatcherFunction<TParams, TData> = (
    appKit: AppKit,
    params: TParams,
    options?: CreateWatcherOptions<TData>,
) => WatcherSubscription;

/**
 * Generic hook for watchers
 */
export function useWatcher<TParams, TData>(
    watcherFn: UseWatcherFunction<TParams, TData>,
    params: TParams,
    options?: CreateWatcherOptions<TData>,
): TData | undefined {
    const appKit = useAppKit();
    const [data, setData] = useState<TData | undefined>(options?.initialData as TData | undefined);

    useEffect(() => {
        const unsubscribe = watcherFn(appKit, params, {
            ...options,
            onChange: (newData) => {
                setData(newData);
                if (options?.onChange) {
                    options.onChange(newData);
                }
            },
        });

        return () => {
            unsubscribe();
        };
    }, [appKit, watcherFn, JSON.stringify(params), JSON.stringify(options)]);

    return data;
}
