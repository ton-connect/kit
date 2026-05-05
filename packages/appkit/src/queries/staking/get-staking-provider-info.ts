/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStakingProviderInfo } from '../../actions/staking/get-staking-provider-info';
import type { GetStakingProviderInfoOptions } from '../../actions/staking/get-staking-provider-info';
import type { GetStakingProviderInfoReturnType } from '../../actions/staking/get-staking-provider-info';
import type { AppKit } from '../../core/app-kit';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute, ExactPartial } from '../../types/utils';
import { filterQueryOptions } from '../../utils';

export type GetStakingProviderInfoErrorType = Error;

export type GetStakingProviderInfoQueryConfig<selectData = GetStakingProviderInfoData> = Compute<
    ExactPartial<GetStakingProviderInfoOptions>
> &
    QueryParameter<
        GetStakingProviderInfoQueryFnData,
        GetStakingProviderInfoErrorType,
        selectData,
        GetStakingProviderInfoQueryKey
    >;

export const getStakingProviderInfoQueryOptions = <selectData = GetStakingProviderInfoData>(
    appKit: AppKit,
    options: GetStakingProviderInfoQueryConfig<selectData> = {},
): GetStakingProviderInfoQueryOptions<selectData> => {
    return {
        ...options.query,
        queryFn: async (context) => {
            const [, parameters] = context.queryKey as [string, GetStakingProviderInfoOptions];
            return getStakingProviderInfo(appKit, parameters);
        },
        queryKey: getStakingProviderInfoQueryKey(options),
    };
};

export type GetStakingProviderInfoQueryFnData = Compute<Awaited<GetStakingProviderInfoReturnType>>;

export type GetStakingProviderInfoData = GetStakingProviderInfoQueryFnData;

export const getStakingProviderInfoQueryKey = (
    options: Compute<ExactPartial<GetStakingProviderInfoOptions>> = {},
): GetStakingProviderInfoQueryKey => {
    return ['stakingProviderInfo', filterQueryOptions(options as unknown as Record<string, unknown>)] as const;
};

export type GetStakingProviderInfoQueryKey = readonly [
    'stakingProviderInfo',
    Compute<ExactPartial<GetStakingProviderInfoOptions>>,
];

export type GetStakingProviderInfoQueryOptions<selectData = GetStakingProviderInfoData> = QueryOptions<
    GetStakingProviderInfoQueryFnData,
    GetStakingProviderInfoErrorType,
    selectData,
    GetStakingProviderInfoQueryKey
>;
