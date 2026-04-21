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

export type UseStakingProvidersReturnType = GetStakingProvidersReturnType;

/**
 * Hook to get available staking provider IDs
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
        try {
            return getStakingProviders(appKit);
        } catch {
            return [];
        }
    }, [appKit]);

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
