/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSyncExternalStore, useCallback } from 'react';
import { getStakingProvider, watchStakingProviders } from '@ton/appkit';
import type { GetStakingProviderOptions, GetStakingProviderReturnType } from '@ton/appkit';

import { useAppKit } from '../../settings/hooks/use-app-kit';

export type UseStakingProviderReturnType = GetStakingProviderReturnType;

/**
 * Hook to get staking provider
 */
export const useStakingProvider = (
    options: GetStakingProviderOptions = {},
): UseStakingProviderReturnType | undefined => {
    const appKit = useAppKit();
    const { id } = options;

    const subscribe = useCallback(
        (onChange: () => void) => {
            return watchStakingProviders(appKit, { onChange });
        },
        [appKit],
    );

    const getSnapshot = useCallback(() => {
        try {
            return getStakingProvider(appKit, { id });
        } catch {
            return undefined;
        }
    }, [appKit, id]);

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
