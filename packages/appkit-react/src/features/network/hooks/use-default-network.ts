/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSyncExternalStore, useCallback } from 'react';
import { getDefaultNetwork, setDefaultNetwork, watchDefaultNetwork } from '@ton/appkit';
import type { GetDefaultNetworkReturnType, Network } from '@ton/appkit';

import { useAppKit } from '../../settings';

/**
 * Return type of {@link useDefaultNetwork} — `[network, setNetwork]` tuple. `network` is the current default (or `undefined`). `setNetwork` calls {@link appkit:setDefaultNetwork} and emits `networks:default-changed`.
 *
 * @public
 * @category Type
 * @section Networks
 */
export type UseDefaultNetworkReturnType = [
    network: GetDefaultNetworkReturnType,
    setNetwork: (network: Network | undefined) => void,
];

/**
 * Read and write AppKit's default network — the network connectors use for new wallet connections. Returns a `useState`-style tuple. The read side re-renders when the default changes through any source (this hook, {@link appkit:setDefaultNetwork}, manager events).
 *
 * @returns Tuple `[network, setNetwork]`.
 *
 * @public
 * @category Hook
 * @section Networks
 */
export const useDefaultNetwork = (): UseDefaultNetworkReturnType => {
    const appKit = useAppKit();

    const subscribe = useCallback(
        (onChange: () => void) => {
            return watchDefaultNetwork(appKit, { onChange });
        },
        [appKit],
    );

    const getSnapshot = useCallback(() => {
        return getDefaultNetwork(appKit);
    }, [appKit]);

    const network = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    const setNetwork = useCallback(
        (newNetwork: Network | undefined) => {
            setDefaultNetwork(appKit, { network: newNetwork });
        },
        [appKit],
    );

    return [network, setNetwork];
};
