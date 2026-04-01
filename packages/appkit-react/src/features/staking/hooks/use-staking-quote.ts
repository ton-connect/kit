/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStakingQuoteQueryOptions } from '@ton/appkit/queries';
import type { GetStakingQuoteData, GetStakingQuoteErrorType, GetStakingQuoteQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../../hooks/use-app-kit';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';

export type UseStakingQuoteParameters<selectData = GetStakingQuoteData> = GetStakingQuoteQueryConfig<selectData>;
export type UseStakingQuoteReturnType<selectData = GetStakingQuoteData> = UseQueryReturnType<
    selectData,
    GetStakingQuoteErrorType
>;

/**
 * Hook to get staking/unstaking quote
 */
export const useStakingQuote = <selectData = GetStakingQuoteData>(
    parameters: UseStakingQuoteParameters<selectData> = {},
): UseStakingQuoteReturnType<selectData> => {
    const appKit = useAppKit();
    return useQuery(getStakingQuoteQueryOptions(appKit, parameters));
};
