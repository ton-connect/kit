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

import { useAppKit } from '../../settings';

/**
 * Return type of {@link useNetworks} — same shape as {@link GetNetworksReturnType}.
 *
 * @public
 * @category Type
 * @section Networks
 */
export type UseNetworksReturnType = GetNetworksReturnType;

/**
 * Read the list of networks configured on AppKit; re-renders when {@link AppKitNetworkManager} adds, replaces or drops a network.
 *
 * @returns Array of configured {@link Network}s.
 *
 * @public
 * @category Hook
 * @section Networks
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
