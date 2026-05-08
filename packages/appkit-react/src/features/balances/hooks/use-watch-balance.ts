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

/**
 * Parameters accepted by {@link useWatchBalance} — same fields as {@link UseWatchBalanceByAddressParameters} minus `address`, which the hook resolves from the selected wallet.
 *
 * @public
 * @category Type
 * @section Balances
 */
export type UseWatchBalanceParameters = Omit<UseWatchBalanceByAddressParameters, 'address'>;

/**
 * Subscribe to balance updates for the currently selected wallet; updates flow into the TanStack Query cache so {@link useBalance} re-renders automatically (use {@link useWatchBalanceByAddress} for a fixed address).
 *
 * @param parameters - {@link UseWatchBalanceParameters} Update callback and optional network override.
 *
 * @sample docs/examples/src/appkit/hooks/balances#USE_WATCH_BALANCE
 *
 * @public
 * @category Hook
 * @section Balances
 */
export const useWatchBalance = (parameters: UseWatchBalanceParameters = {}): void => {
    const address = useAddress();
    const network = useNetwork();

    useWatchBalanceByAddress({ ...parameters, address, network });
};
