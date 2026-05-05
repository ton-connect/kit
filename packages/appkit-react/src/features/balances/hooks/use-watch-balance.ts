/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useAddress } from '../../wallets/hooks/use-address';
import { useNetwork } from '../../network/hooks/use-network';
import { useWatchBalanceByAddress } from './use-watch-balance-by-address';
import type { UseWatchBalanceByAddressParameters } from './use-watch-balance-by-address';

export type UseWatchBalanceParameters = Omit<UseWatchBalanceByAddressParameters, 'address'>;

/**
 * Hook to watch balance of the currently selected wallet in real-time.
 * Automatically updates the TanStack Query cache for `useBalance`.
 */
export const useWatchBalance = (parameters: UseWatchBalanceParameters = {}): void => {
    const address = useAddress();
    const network = useNetwork();

    useWatchBalanceByAddress({ ...parameters, address, network });
};
