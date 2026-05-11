/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStakedBalanceQueryOptions } from '@ton/appkit/queries';
import type { GetStakedBalanceData, GetStakedBalanceErrorType, GetStakedBalanceQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';
import { useNetwork } from '../../network';

/**
 * Parameters accepted by {@link useStakedBalance} — TanStack Query options (`select`, `enabled`, `staleTime`, …) plus the owner address, optional network override and optional `providerId`.
 *
 * @public
 * @category Type
 * @section Staking
 */
export type UseStakedBalanceParameters<selectData = GetStakedBalanceData> = GetStakedBalanceQueryConfig<selectData>;

/**
 * Return type of {@link useStakedBalance} — TanStack Query result carrying the user's staked balance.
 *
 * @public
 * @category Type
 * @section Staking
 */
export type UseStakedBalanceReturnType<selectData = GetStakedBalanceData> = UseQueryReturnType<
    selectData,
    GetStakedBalanceErrorType
>;

/**
 * React hook reading a user's staked balance from a staking provider through TanStack Query — total staked plus, depending on the provider, any instant-unstake balance available right now. Defaults to the selected wallet's network; if no wallet is selected, falls back to AppKit's default network, or mainnet when none is set.
 *
 * @param parameters - {@link UseStakedBalanceParameters} Owner address, optional `providerId`, optional network override, and TanStack Query overrides.
 * @returns TanStack Query result for the staked-balance read.
 *
 * @public
 * @category Hook
 * @section Staking
 */
export const useStakedBalance = <selectData = GetStakedBalanceData>(
    parameters: UseStakedBalanceParameters<selectData> = {},
): UseStakedBalanceReturnType<selectData> => {
    const appKit = useAppKit();
    const walletNetwork = useNetwork();

    return useQuery(
        getStakedBalanceQueryOptions(appKit, { ...parameters, network: parameters.network ?? walletNetwork }),
    );
};
