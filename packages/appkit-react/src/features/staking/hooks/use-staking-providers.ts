/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSyncExternalStore, useCallback } from 'react';
import { getStakingProviders, watchStakingProviders } from '@ton/appkit';
import type { GetStakingProvidersReturnType } from '@ton/appkit';

import { useAppKit } from '../../settings';

/**
 * Return type of {@link useStakingProviders} — array of registered staking providers.
 *
 * @public
 * @category Type
 * @section Staking
 */
export type UseStakingProvidersReturnType = GetStakingProvidersReturnType;

/**
 * React hook returning every staking provider registered on the AppKit instance (both those passed via config and those added later); subscribes to provider-registry changes via {@link watchStakingProviders}.
 *
 * @returns Array of registered staking providers.
 *
 * @public
 * @category Hook
 * @section Staking
 */
export const useStakingProviders = (): UseStakingProvidersReturnType => {
    const appKit = useAppKit();

    const subscribe = useCallback(
        (onChange: () => void) => {
            return watchStakingProviders(appKit, { onChange });
        },
        [appKit],
    );

    const getSnapshot = useCallback(() => {
        return getStakingProviders(appKit);
    }, [appKit]);

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
