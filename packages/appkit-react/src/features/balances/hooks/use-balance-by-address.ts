/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getBalanceByAddressQueryOptions } from '@ton/appkit/queries';
import type { GetBalanceByAddressData, GetBalanceErrorType, GetBalanceByAddressQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';
import { useNetwork } from '../../network';

/**
 * Parameters accepted by {@link useBalanceByAddress} — TanStack Query options (`select`, `enabled`, `staleTime`, …) plus the target address and optional network override.
 *
 * @public
 * @category Type
 * @section Balances
 */
export type UseBalanceByAddressParameters<selectData = GetBalanceByAddressData> =
    GetBalanceByAddressQueryConfig<selectData>;

/**
 * Return type of {@link useBalanceByAddress} — TanStack Query result carrying `data`, `isLoading`, `error` and the standard companions.
 *
 * @public
 * @category Type
 * @section Balances
 */
export type UseBalanceByAddressReturnType<selectData = GetBalanceByAddressData> = UseQueryReturnType<
    selectData,
    GetBalanceErrorType
>;

/**
 * React hook reading the Toncoin balance of an arbitrary address through TanStack Query — useful for wallets that aren't selected in AppKit (use {@link useBalance} for the selected wallet).
 *
 * @param parameters - {@link UseBalanceByAddressParameters} Target address, optional network override, and TanStack Query overrides.
 * @returns TanStack Query result for the balance read.
 *
 * @sample docs/examples/src/appkit/hooks/balances#USE_BALANCE_BY_ADDRESS
 *
 * @public
 * @category Hook
 * @section Balances
 */
export const useBalanceByAddress = <selectData = GetBalanceByAddressData>(
    parameters: UseBalanceByAddressParameters<selectData> = {},
): UseBalanceByAddressReturnType<selectData> => {
    const appKit = useAppKit();
    const walletNetwork = useNetwork();

    return useQuery(
        getBalanceByAddressQueryOptions(appKit, { ...parameters, network: parameters.network ?? walletNetwork }),
    );
};
