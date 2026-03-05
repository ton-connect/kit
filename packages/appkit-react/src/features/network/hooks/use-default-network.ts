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

import { useAppKit } from '../../../hooks/use-app-kit';

export type UseDefaultNetworkReturnType = [
    network: GetDefaultNetworkReturnType,
    setNetwork: (network: Network | undefined) => void,
];

/**
 * Hook to get and set the default network for wallet connections.
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
