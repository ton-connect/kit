/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSyncExternalStore, useCallback, useRef } from 'react';
import { getNetworks, watchNetworks } from '@ton/appkit';
import type { GetNetworksReturnType } from '@ton/appkit';

import { useAppKit } from '../../../hooks/use-app-kit';

export type UseNetworksReturnType = GetNetworksReturnType;

/**
 * Hook to get all configured networks
 */
export const useNetworks = (): UseNetworksReturnType => {
    const appKit = useAppKit();
    const cachedRef = useRef<GetNetworksReturnType>([]);

    const subscribe = useCallback(
        (onChange: () => void) => {
            return watchNetworks(appKit, { onChange });
        },
        [appKit],
    );

    const getSnapshot = useCallback(() => {
        const networks = getNetworks(appKit);

        if (
            networks.length === cachedRef.current.length &&
            networks.every((n, i) => n.chainId === cachedRef.current[i]?.chainId)
        ) {
            return cachedRef.current;
        }

        cachedRef.current = networks;
        return networks;
    }, [appKit]);

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
