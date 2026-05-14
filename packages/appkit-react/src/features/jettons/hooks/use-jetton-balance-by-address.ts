/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getJettonBalanceByAddressQueryOptions } from '@ton/appkit/queries';
import type {
    GetJettonBalanceByAddressData,
    GetJettonBalanceErrorType,
    GetJettonBalanceByAddressQueryConfig,
} from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';
import { useNetwork } from '../../network';

/**
 * Parameters accepted by {@link useJettonBalanceByAddress} — TanStack Query options (`select`, `enabled`, `staleTime`, …) plus the jetton master, owner address, decimals and optional network override.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export type UseJettonBalanceByAddressParameters<selectData = GetJettonBalanceByAddressData> =
    GetJettonBalanceByAddressQueryConfig<selectData>;

/**
 * Return type of {@link useJettonBalanceByAddress} — TanStack Query result carrying `data`, `isLoading`, `error` and the standard companions.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export type UseJettonBalanceByAddressReturnType<selectData = GetJettonBalanceByAddressData> = UseQueryReturnType<
    selectData,
    GetJettonBalanceErrorType
>;

/**
 * React hook reading a jetton balance for a given owner through TanStack Query — derives the owner's jetton-wallet address from the master and formats the balance using the supplied decimals.
 *
 * @param parameters - {@link UseJettonBalanceByAddressParameters} Jetton master, owner address, decimals, optional network override and TanStack Query overrides.
 * @expand parameters
 * @returns TanStack Query result for the jetton balance read.
 *
 * @sample docs/examples/src/appkit/hooks/jettons#USE_JETTON_BALANCE_BY_ADDRESS
 *
 * @public
 * @category Hook
 * @section Jettons
 */
export const useJettonBalanceByAddress = <selectData = GetJettonBalanceByAddressData>(
    parameters: UseJettonBalanceByAddressParameters<selectData> = {},
): UseJettonBalanceByAddressReturnType<selectData> => {
    const appKit = useAppKit();
    const walletNetwork = useNetwork();

    return useQuery(
        getJettonBalanceByAddressQueryOptions(appKit, { ...parameters, network: parameters.network ?? walletNetwork }),
    );
};
