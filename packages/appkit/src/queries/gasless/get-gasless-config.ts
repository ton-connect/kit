/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getGaslessConfig } from '../../actions/gasless/get-gasless-config';
import type {
    GetGaslessConfigErrorType,
    GetGaslessConfigOptions,
    GetGaslessConfigReturnType,
} from '../../actions/gasless/get-gasless-config';
import type { AppKit } from '../../core/app-kit';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute, ExactPartial } from '../../types/utils';
import { filterQueryOptions } from '../../utils';

export type { GetGaslessConfigErrorType };

export type GetGaslessConfigQueryConfig<selectData = GetGaslessConfigData> = Compute<
    ExactPartial<GetGaslessConfigOptions>
> &
    QueryParameter<GetGaslessConfigQueryFnData, GetGaslessConfigErrorType, selectData, GetGaslessConfigQueryKey>;

export const getGaslessConfigQueryOptions = <selectData = GetGaslessConfigData>(
    appKit: AppKit,
    options: GetGaslessConfigQueryConfig<selectData> = {},
): GetGaslessConfigQueryOptions<selectData> => {
    return {
        ...options.query,
        queryFn: async (context) => {
            const [, parameters] = context.queryKey as [string, GetGaslessConfigOptions];
            return getGaslessConfig(appKit, parameters);
        },
        queryKey: getGaslessConfigQueryKey(options),
    };
};

export type GetGaslessConfigQueryFnData = Compute<Awaited<GetGaslessConfigReturnType>>;

export type GetGaslessConfigData = GetGaslessConfigQueryFnData;

export const getGaslessConfigQueryKey = (
    options: Compute<ExactPartial<GetGaslessConfigOptions>> = {},
): GetGaslessConfigQueryKey => {
    return ['gaslessConfig', filterQueryOptions(options as unknown as Record<string, unknown>)] as const;
};

export type GetGaslessConfigQueryKey = readonly ['gaslessConfig', Compute<ExactPartial<GetGaslessConfigOptions>>];

export type GetGaslessConfigQueryOptions<selectData = GetGaslessConfigData> = QueryOptions<
    GetGaslessConfigQueryFnData,
    GetGaslessConfigErrorType,
    selectData,
    GetGaslessConfigQueryKey
>;
