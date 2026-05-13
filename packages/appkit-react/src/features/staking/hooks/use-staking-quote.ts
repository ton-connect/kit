/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStakingQuoteQueryOptions } from '@ton/appkit/queries';
import type { GetStakingQuoteData, GetStakingQuoteErrorType, GetStakingQuoteQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';
import { useNetwork } from '../../network';

/**
 * Parameters accepted by {@link useStakingQuote} — TanStack Query options (`select`, `enabled`, `staleTime`, …) plus stake/unstake amount, direction, target asset and optional `providerId`/network override.
 *
 * @public
 * @category Type
 * @section Staking
 */
export type UseStakingQuoteParameters<selectData = GetStakingQuoteData> = GetStakingQuoteQueryConfig<selectData>;

/**
 * Return type of {@link useStakingQuote} — TanStack Query result carrying a {@link appkit:StakingQuote}.
 *
 * @public
 * @category Type
 * @section Staking
 */
export type UseStakingQuoteReturnType<selectData = GetStakingQuoteData> = UseQueryReturnType<
    selectData,
    GetStakingQuoteErrorType
>;

/**
 * Quote a stake or unstake — given an amount, direction (`'stake'` / `'unstake'`) and the target asset, returns the rate, expected output and the provider-specific metadata required to feed {@link useBuildStakeTransaction}. `data` is the {@link appkit:StakingQuote} payload. Defaults to the selected wallet's network; if no wallet is selected, falls back to AppKit's default network, or mainnet when none is set.
 *
 * @param parameters - {@link UseStakingQuoteParameters} Quote parameters, optional `providerId`, optional network override, and TanStack Query overrides.
 * @returns TanStack Query result for the quote read.
 *
 * @public
 * @category Hook
 * @section Staking
 */
export const useStakingQuote = <selectData = GetStakingQuoteData>(
    parameters: UseStakingQuoteParameters<selectData> = {},
): UseStakingQuoteReturnType<selectData> => {
    const appKit = useAppKit();
    const walletNetwork = useNetwork();

    return useQuery(
        getStakingQuoteQueryOptions(appKit, { ...parameters, network: parameters.network ?? walletNetwork }),
    );
};
