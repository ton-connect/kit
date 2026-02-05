/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TokenAmount } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { getBalance } from '../../actions/balances/get-balance';
import type { GetBalanceOptions as GetBalanceParameters } from '../../actions/balances/get-balance';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute, ExactPartial } from '../../types/utils';
import { filterQueryOptions } from '../../utils';

export type GetBalanceErrorType = Error;

export type GetBalanceQueryConfig<selectData = GetBalanceData> = Compute<ExactPartial<GetBalanceParameters>> &
    QueryParameter<GetBalanceQueryFnData, GetBalanceErrorType, selectData, GetBalanceQueryKey>;

export const getBalanceQueryOptions = <selectData = GetBalanceData>(
    appKit: AppKit,
    options: GetBalanceQueryConfig<selectData> = {},
): GetBalanceQueryOptions<selectData> => {
    return {
        ...options.query,
        enabled: Boolean(options.address && (options.query?.enabled ?? true)),
        queryFn: async (context) => {
            const [, parameters] = context.queryKey as [string, GetBalanceParameters];
            if (!parameters.address) throw new Error('address is required');
            const balance = await getBalance(appKit, {
                ...(parameters as GetBalanceParameters),
                address: parameters.address,
                network: parameters.network,
            });
            return balance ?? null;
        },
        queryKey: getBalanceQueryKey(options),
    };
};

export type GetBalanceQueryFnData = Compute<TokenAmount | null>;

export type GetBalanceData = GetBalanceQueryFnData;

export const getBalanceQueryKey = (options: Compute<ExactPartial<GetBalanceParameters>> = {}): GetBalanceQueryKey => {
    return ['balance', filterQueryOptions(options)] as const;
};

export type GetBalanceQueryKey = readonly ['balance', Compute<ExactPartial<GetBalanceParameters>>];

export type GetBalanceQueryOptions<selectData = GetBalanceData> = QueryOptions<
    GetBalanceQueryFnData,
    GetBalanceErrorType,
    selectData,
    GetBalanceQueryKey
>;
