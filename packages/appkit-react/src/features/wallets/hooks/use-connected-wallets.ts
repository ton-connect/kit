/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSyncExternalStore, useCallback } from 'react';
import { getConnectedWallets, watchConnectedWallets } from '@ton/appkit';
import type { GetConnectedWalletsReturnType } from '@ton/appkit';

import { useAppKit } from '../../settings';

/**
 * Return type of {@link useConnectedWallets} — same shape as {@link appkit:GetConnectedWalletsReturnType}.
 *
 * @public
 * @category Type
 * @section Wallets
 */
export type UseConnectedWalletsReturnType = GetConnectedWalletsReturnType;

/**
 * Read the list of currently connected wallets across all registered connectors; re-renders when a wallet connects or disconnects.
 *
 * @returns Read-only array of {@link appkit:WalletInterface}s.
 *
 * @public
 * @category Hook
 * @section Wallets
 */
export const useConnectedWallets = (): UseConnectedWalletsReturnType => {
    const appKit = useAppKit();

    const subscribe = useCallback(
        (onChange: () => void) => {
            return watchConnectedWallets(appKit, { onChange });
        },
        [appKit],
    );

    const getSnapshot = useCallback(() => {
        return getConnectedWallets(appKit);
    }, [appKit]);

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
