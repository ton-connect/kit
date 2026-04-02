/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStakingProviders } from '../../actions/staking/get-staking-providers';
import type { GetStakingProvidersReturnType } from '../../actions/staking/get-staking-providers';
import type { AppKit } from '../../core/app-kit';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute } from '../../types/utils';

export type GetStakingProvidersErrorType = Error;

export type GetStakingProvidersQueryConfig<selectData = GetStakingProvidersData> = QueryParameter<
    GetStakingProvidersQueryFnData,
    GetStakingProvidersErrorType,
    selectData,
    GetStakingProvidersQueryKey
>;

export const getStakingProvidersQueryOptions = <selectData = GetStakingProvidersData>(
    appKit: AppKit,
    options: GetStakingProvidersQueryConfig<selectData> = {},
): GetStakingProvidersQueryOptions<selectData> => {
    return {
        ...options.query,
        queryFn: async () => {
            return getStakingProviders(appKit);
        },
        queryKey: getStakingProvidersQueryKey(),
    };
};

export type GetStakingProvidersQueryFnData = Compute<Awaited<GetStakingProvidersReturnType>>;

export type GetStakingProvidersData = GetStakingProvidersQueryFnData;

export const getStakingProvidersQueryKey = (): GetStakingProvidersQueryKey => {
    return ['stakingProviders'] as const;
};

export type GetStakingProvidersQueryKey = readonly ['stakingProviders'];

export type GetStakingProvidersQueryOptions<selectData = GetStakingProvidersData> = QueryOptions<
    GetStakingProvidersQueryFnData,
    GetStakingProvidersErrorType,
    selectData,
    GetStakingProvidersQueryKey
>;
