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

export type GetBalanceOptions<selectData = GetBalanceData> = Compute<ExactPartial<GetBalanceParameters>> &
    QueryParameter<GetBalanceQueryFnData, GetBalanceErrorType, selectData, GetBalanceQueryKey>;

export function getBalanceQueryOptions<selectData = GetBalanceData>(
    appKit: AppKit,
    options: GetBalanceOptions<selectData> = {},
): GetBalanceQueryOptions<selectData> {
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
}

export type GetBalanceQueryFnData = Compute<TokenAmount | null>;

export type GetBalanceData = GetBalanceQueryFnData;

export function getBalanceQueryKey(options: Compute<ExactPartial<GetBalanceParameters>> = {}) {
    return ['balance', filterQueryOptions(options)] as const;
}

export type GetBalanceQueryKey = ReturnType<typeof getBalanceQueryKey>;

export type GetBalanceQueryOptions<selectData = GetBalanceData> = QueryOptions<
    GetBalanceQueryFnData,
    GetBalanceErrorType,
    selectData,
    GetBalanceQueryKey
>;
