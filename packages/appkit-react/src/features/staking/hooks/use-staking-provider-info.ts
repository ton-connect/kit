/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStakingProviderInfoQueryOptions } from '@ton/appkit/queries';
import type {
    GetStakingProviderInfoData,
    GetStakingProviderInfoErrorType,
    GetStakingProviderInfoQueryConfig,
} from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';
import { useNetwork } from '../../network';
import { useStakingProvider } from './use-staking-provider';

/**
 * Parameters accepted by {@link useStakingProviderInfo} — TanStack Query options (`select`, `enabled`, `staleTime`, …) plus an optional `providerId` and network override.
 *
 * @public
 * @category Type
 * @section Staking
 */
export type UseStakingProviderInfoParameters<selectData = GetStakingProviderInfoData> =
    GetStakingProviderInfoQueryConfig<selectData>;

/**
 * Return type of {@link useStakingProviderInfo} — TanStack Query result carrying live {@link appkit:StakingProviderInfo}.
 *
 * @public
 * @category Type
 * @section Staking
 */
export type UseStakingProviderInfoReturnType<selectData = GetStakingProviderInfoData> = UseQueryReturnType<
    selectData,
    GetStakingProviderInfoErrorType
>;

/**
 * React hook reading live staking-pool info for a provider through TanStack Query — APY, instant-unstake liquidity and (for liquid staking) the current exchange rate. Use {@link useStakingProviderMetadata} for static metadata (name, stake/receive tokens, supported unstake modes). Defaults to the selected wallet's network. If no wallet is selected, falls back to AppKit's default network, or mainnet when none is set.
 *
 * @param parameters - {@link UseStakingProviderInfoParameters} Optional `providerId`, network override, and TanStack Query overrides.
 * @returns TanStack Query result for the live provider info.
 *
 * @public
 * @category Hook
 * @section Staking
 */
export const useStakingProviderInfo = <selectData = GetStakingProviderInfoData>(
    parameters: UseStakingProviderInfoParameters<selectData> = {},
): UseStakingProviderInfoReturnType<selectData> => {
    const appKit = useAppKit();
    const walletNetwork = useNetwork();
    const provider = useStakingProvider({ id: parameters.providerId });

    return useQuery(
        getStakingProviderInfoQueryOptions(appKit, {
            ...parameters,
            providerId: parameters.providerId ?? provider?.providerId,
            network: parameters.network ?? walletNetwork,
        }),
    );
};
