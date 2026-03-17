/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import { getBlockNumber } from '../../actions/network/get-block-number';
import type { GetBlockNumberOptions } from '../../actions/network/get-block-number';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute, ExactPartial } from '../../types/utils';
import { filterQueryOptions } from '../../utils';
import type { GetBlockNumberReturnType } from '../../actions/network/get-block-number';

export type GetBlockNumberErrorType = Error;

export type GetBlockNumberData = GetBlockNumberQueryFnData;

export type GetBlockNumberQueryConfig<selectData = GetBlockNumberData> = Compute<ExactPartial<GetBlockNumberOptions>> &
    QueryParameter<GetBlockNumberQueryFnData, GetBlockNumberErrorType, selectData, GetBlockNumberQueryKey>;

export const getBlockNumberQueryOptions = <selectData = GetBlockNumberData>(
    appKit: AppKit,
    options: GetBlockNumberQueryConfig<selectData> = {},
): GetBlockNumberQueryOptions<selectData> => {
    return {
        ...options.query,
        gcTime: 0,
        queryFn: async (context) => {
            const [, parameters] = context.queryKey as [string, GetBlockNumberOptions];
            const blockNumber = await getBlockNumber(appKit, parameters);
            return blockNumber;
        },
        queryKey: getBlockNumberQueryKey(options),
    };
};

export type GetBlockNumberQueryFnData = Compute<Awaited<GetBlockNumberReturnType>>;

export const getBlockNumberQueryKey = (
    options: Compute<ExactPartial<GetBlockNumberOptions>> = {},
): GetBlockNumberQueryKey => {
    return ['blockNumber', filterQueryOptions(options)] as const;
};

export type GetBlockNumberQueryKey = readonly ['blockNumber', Compute<ExactPartial<GetBlockNumberOptions>>];

export type GetBlockNumberQueryOptions<selectData = GetBlockNumberData> = QueryOptions<
    GetBlockNumberQueryFnData,
    GetBlockNumberErrorType,
    selectData,
    GetBlockNumberQueryKey
>;
