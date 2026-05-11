/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSyncExternalStore, useCallback } from 'react';
import { getSwapProviders, watchSwapProviders } from '@ton/appkit';
import type { GetSwapProvidersReturnType } from '@ton/appkit';

import { useAppKit } from '../../settings/hooks/use-app-kit';

/**
 * Return type of {@link useSwapProviders} — array of every `SwapProviderInterface` currently registered on the AppKit instance.
 *
 * @public
 * @category Type
 * @section Swap
 */
export type UseSwapProvidersReturnType = GetSwapProvidersReturnType;

/**
 * List every swap provider registered on the AppKit instance (both those passed via {@link appkit:AppKitConfig}`.providers` and those added later through {@link appkit:registerProvider}); subscribes to {@link appkit:watchSwapProviders} and re-reads via {@link appkit:getSwapProviders} so the array stays in sync.
 *
 * @returns Array of registered swap providers.
 *
 * @public
 * @category Hook
 * @section Swap
 */
export const useSwapProviders = (): UseSwapProvidersReturnType => {
    const appKit = useAppKit();

    const subscribe = useCallback(
        (onChange: () => void) => {
            return watchSwapProviders(appKit, { onChange });
        },
        [appKit],
    );

    const getSnapshot = useCallback(() => {
        return getSwapProviders(appKit);
    }, [appKit]);

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
