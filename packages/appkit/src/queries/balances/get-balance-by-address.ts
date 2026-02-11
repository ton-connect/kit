/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import { getBalanceByAddress } from '../../actions/balances/get-balance-by-address';
import type { GetBalanceByAddressOptions } from '../../actions/balances/get-balance-by-address';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute, ExactPartial } from '../../types/utils';
import { filterQueryOptions } from '../../utils';
import type { GetBalanceByAddressReturnType } from '../../actions/balances/get-balance-by-address';

export type GetBalanceErrorType = Error;

export type GetBalanceByAddressData = GetBalanceQueryFnData;

export type GetBalanceByAddressQueryConfig<selectData = GetBalanceByAddressData> = Compute<
    ExactPartial<GetBalanceByAddressOptions>
> &
    QueryParameter<GetBalanceQueryFnData, GetBalanceErrorType, selectData, GetBalanceByAddressQueryKey>;

export const getBalanceByAddressQueryOptions = <selectData = GetBalanceByAddressData>(
    appKit: AppKit,
    options: GetBalanceByAddressQueryConfig<selectData> = {},
): GetBalanceByAddressQueryOptions<selectData> => {
    return {
        ...options.query,
        enabled: Boolean(options.address && (options.query?.enabled ?? true)),
        queryFn: async (context) => {
            const [, parameters] = context.queryKey as [string, GetBalanceByAddressOptions];
            if (!parameters.address) throw new Error('address is required');
            const balance = await getBalanceByAddress(appKit, parameters);
            return balance ?? null;
        },
        queryKey: getBalanceByAddressQueryKey(options),
    };
};

export type GetBalanceQueryFnData = Compute<Awaited<GetBalanceByAddressReturnType>>;

export const getBalanceByAddressQueryKey = (
    options: Compute<ExactPartial<GetBalanceByAddressOptions>> = {},
): GetBalanceByAddressQueryKey => {
    return ['balance', filterQueryOptions(options)] as const;
};

export type GetBalanceByAddressQueryKey = readonly ['balance', Compute<ExactPartial<GetBalanceByAddressOptions>>];

export type GetBalanceByAddressQueryOptions<selectData = GetBalanceByAddressData> = QueryOptions<
    GetBalanceQueryFnData,
    GetBalanceErrorType,
    selectData,
    GetBalanceByAddressQueryKey
>;
