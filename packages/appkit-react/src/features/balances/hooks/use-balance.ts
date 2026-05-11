/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { GetBalanceByAddressData } from '@ton/appkit/queries';

import { useAddress } from '../../wallets/hooks/use-address';
import { useBalanceByAddress } from './use-balance-by-address';
import type { UseBalanceByAddressParameters, UseBalanceByAddressReturnType } from './use-balance-by-address';

/**
 * Parameters accepted by {@link useBalance} — same shape as {@link UseBalanceByAddressParameters}; the hook resolves `address` from the selected wallet and overrides any value supplied here.
 *
 * @public
 * @category Type
 * @section Balances
 */
export type UseBalanceParameters<selectData = GetBalanceByAddressData> = UseBalanceByAddressParameters<selectData>;

/**
 * Return type of {@link useBalance} — TanStack Query result carrying `data`, `isLoading`, `error` and the standard companions.
 *
 * @public
 * @category Type
 * @section Balances
 */
export type UseBalanceReturnType<selectData = GetBalanceByAddressData> = UseBalanceByAddressReturnType<selectData>;

/**
 * React hook reading the Toncoin balance of the currently selected wallet through TanStack Query — auto-resolves the wallet address (use {@link useBalanceByAddress} for an arbitrary address).
 *
 * @param parameters - {@link UseBalanceParameters} TanStack Query overrides (`select`, `enabled`, `staleTime`, …) and an optional network override.
 * @returns TanStack Query result for the balance read.
 *
 * @sample docs/examples/src/appkit/hooks/balances#USE_BALANCE
 *
 * @public
 * @category Hook
 * @section Balances
 */
export const useBalance = <selectData = GetBalanceByAddressData>(
    parameters: UseBalanceParameters<selectData> = {},
): UseBalanceReturnType<selectData> => {
    const address = useAddress();

    return useBalanceByAddress({ ...parameters, address });
};
