/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStakingQuote } from '../../actions/staking/get-staking-quote';
import type { GetStakingQuoteOptions } from '../../actions/staking/get-staking-quote';
import type { GetStakingQuoteReturnType } from '../../actions/staking/get-staking-quote';
import type { AppKit } from '../../core/app-kit';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute, ExactPartial } from '../../types/utils';
import { filterQueryOptions } from '../../utils';

export type GetStakingQuoteErrorType = Error;

export type GetStakingQuoteQueryConfig<selectData = GetStakingQuoteData> = Compute<
    ExactPartial<GetStakingQuoteOptions>
> &
    QueryParameter<GetStakingQuoteQueryFnData, GetStakingQuoteErrorType, selectData, GetStakingQuoteQueryKey>;

export const getStakingQuoteQueryOptions = <selectData = GetStakingQuoteData>(
    appKit: AppKit,
    options: GetStakingQuoteQueryConfig<selectData> = {},
): GetStakingQuoteQueryOptions<selectData> => {
    return {
        ...options.query,
        enabled: Boolean(options.amount && options.direction && (options.query?.enabled ?? true)),
        queryFn: async (context) => {
            const [, parameters] = context.queryKey as [string, GetStakingQuoteOptions];
            if (!parameters.amount || !parameters.direction) {
                throw new Error('amount and direction are required');
            }

            return getStakingQuote(appKit, parameters);
        },
        queryKey: getStakingQuoteQueryKey(options),
    };
};

export type GetStakingQuoteQueryFnData = Compute<Awaited<GetStakingQuoteReturnType>>;

export type GetStakingQuoteData = GetStakingQuoteQueryFnData;

export const getStakingQuoteQueryKey = (
    options: Compute<ExactPartial<GetStakingQuoteOptions>> = {},
): GetStakingQuoteQueryKey => {
    return ['stakingQuote', filterQueryOptions(options as unknown as Record<string, unknown>)] as const;
};

export type GetStakingQuoteQueryKey = readonly ['stakingQuote', Compute<ExactPartial<GetStakingQuoteOptions>>];

export type GetStakingQuoteQueryOptions<selectData = GetStakingQuoteData> = QueryOptions<
    GetStakingQuoteQueryFnData,
    GetStakingQuoteErrorType,
    selectData,
    GetStakingQuoteQueryKey
>;
