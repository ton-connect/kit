/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSyncExternalStore, useCallback } from 'react';
import { getNetworks, watchNetworks } from '@ton/appkit';
import type { GetNetworksReturnType } from '@ton/appkit';

import { useAppKit } from '../../../hooks/use-app-kit';

export type UseNetworksReturnType = GetNetworksReturnType;

/**
 * Hook to get all configured networks
 */
export const useNetworks = (): UseNetworksReturnType => {
    const appKit = useAppKit();

    const subscribe = useCallback(
        (onChange: () => void) => {
            return watchNetworks(appKit, { onChange });
        },
        [appKit],
    );

    const getSnapshot = useCallback(() => {
        return getNetworks(appKit);
    }, [appKit]);

    return useSyncExternalStore(subscribe, getSnapshot, () => []);
};
