/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStakedBalance } from '../../actions/staking/get-staked-balance';
import type { GetStakedBalanceOptions } from '../../actions/staking/get-staked-balance';
import type { GetStakedBalanceReturnType } from '../../actions/staking/get-staked-balance';
import type { AppKit } from '../../core/app-kit';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute, ExactPartial } from '../../types/utils';
import { filterQueryOptions } from '../../utils';

export type GetStakedBalanceErrorType = Error;

export type GetStakedBalanceQueryConfig<selectData = GetStakedBalanceData> = Compute<
    ExactPartial<GetStakedBalanceOptions>
> &
    QueryParameter<GetStakedBalanceQueryFnData, GetStakedBalanceErrorType, selectData, GetStakedBalanceQueryKey>;

export const getStakedBalanceQueryOptions = <selectData = GetStakedBalanceData>(
    appKit: AppKit,
    options: GetStakedBalanceQueryConfig<selectData> = {},
): GetStakedBalanceQueryOptions<selectData> => {
    return {
        ...options.query,
        enabled: Boolean(options.userAddress && (options.query?.enabled ?? true)),
        queryFn: async (context) => {
            const [, parameters] = context.queryKey as [string, GetStakedBalanceOptions];
            if (!parameters.userAddress) {
                throw new Error('userAddress is required');
            }

            return getStakedBalance(appKit, parameters);
        },
        queryKey: getStakedBalanceQueryKey(options),
    };
};

export type GetStakedBalanceQueryFnData = Compute<Awaited<GetStakedBalanceReturnType>>;

export type GetStakedBalanceData = GetStakedBalanceQueryFnData;

export const getStakedBalanceQueryKey = (
    options: Compute<ExactPartial<GetStakedBalanceOptions>> = {},
): GetStakedBalanceQueryKey => {
    return ['stakedBalance', filterQueryOptions(options as unknown as Record<string, unknown>)] as const;
};

export type GetStakedBalanceQueryKey = readonly ['stakedBalance', Compute<ExactPartial<GetStakedBalanceOptions>>];

export type GetStakedBalanceQueryOptions<selectData = GetStakedBalanceData> = QueryOptions<
    GetStakedBalanceQueryFnData,
    GetStakedBalanceErrorType,
    selectData,
    GetStakedBalanceQueryKey
>;
