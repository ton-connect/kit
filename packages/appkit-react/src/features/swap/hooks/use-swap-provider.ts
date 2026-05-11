/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSyncExternalStore, useCallback } from 'react';
import { getSwapProvider, setDefaultSwapProvider, watchSwapProviders } from '@ton/appkit';
import type { GetSwapProviderReturnType } from '@ton/appkit';

import { useAppKit } from '../../settings/hooks/use-app-kit';

/**
 * Return type of {@link useSwapProvider} — `[provider, setProviderId]` tuple. `provider` is the default `SwapProviderInterface` (or `undefined` when none is registered); `setProviderId` calls {@link appkit:setDefaultSwapProvider} and emits `provider:default-changed`, which {@link appkit:watchSwapProviders} picks up.
 *
 * @public
 * @category Type
 * @section Swap
 */
export type UseSwapProviderReturnType = readonly [GetSwapProviderReturnType | undefined, (providerId: string) => void];

/**
 * Read and switch the default swap provider — subscribes to {@link appkit:watchSwapProviders} and re-reads via {@link appkit:getSwapProvider}. Returns a `useState`-style tuple; the read swallows the throw from {@link appkit:getSwapProvider} (which throws when no provider matches — or when no id is passed and no default has been registered) and yields `undefined` instead.
 *
 * @returns Tuple `[provider, setProviderId]`.
 *
 * @public
 * @category Hook
 * @section Swap
 */
export const useSwapProvider = (): UseSwapProviderReturnType => {
    const appKit = useAppKit();

    const subscribe = useCallback(
        (onChange: () => void) => {
            return watchSwapProviders(appKit, { onChange });
        },
        [appKit],
    );

    const getSnapshot = useCallback(() => {
        try {
            return getSwapProvider(appKit);
        } catch {
            return undefined;
        }
    }, [appKit]);

    const provider = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    const setProviderId = useCallback(
        (providerId: string) => {
            setDefaultSwapProvider(appKit, { providerId });
        },
        [appKit],
    );

    return [provider, setProviderId] as const;
};
