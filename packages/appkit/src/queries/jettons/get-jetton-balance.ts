/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TokenAmount } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { getJettonBalance } from '../../actions/jettons/get-jetton-balance';
import type { GetJettonBalanceOptions as GetJettonBalanceParameters } from '../../actions/jettons/get-jetton-balance';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute, ExactPartial } from '../../types/utils';
import { filterQueryOptions } from '../../utils';

export type GetJettonBalanceErrorType = Error;

export type GetJettonBalanceQueryConfig<selectData = GetJettonBalanceData> = Compute<
    ExactPartial<GetJettonBalanceParameters>
> &
    QueryParameter<GetJettonBalanceQueryFnData, GetJettonBalanceErrorType, selectData, GetJettonBalanceQueryKey>;

export const getJettonBalanceQueryOptions = <selectData = GetJettonBalanceData>(
    appKit: AppKit,
    options: GetJettonBalanceQueryConfig<selectData> = {},
): GetJettonBalanceQueryOptions<selectData> => {
    return {
        ...options.query,
        enabled: Boolean(options.jettonAddress && options.ownerAddress && (options.query?.enabled ?? true)),
        queryFn: async (context) => {
            const [, parameters] = context.queryKey as [string, GetJettonBalanceParameters];
            if (!parameters.jettonAddress) throw new Error('jettonAddress is required');
            if (!parameters.ownerAddress) throw new Error('ownerAddress is required');

            const balance = await getJettonBalance(appKit, {
                ...(parameters as GetJettonBalanceParameters),
                jettonAddress: parameters.jettonAddress,
                ownerAddress: parameters.ownerAddress,
                network: parameters.network,
            });
            return balance;
        },
        queryKey: getJettonBalanceQueryKey(options),
    };
};

export type GetJettonBalanceQueryFnData = Compute<TokenAmount>;

export type GetJettonBalanceData = GetJettonBalanceQueryFnData;

export const getJettonBalanceQueryKey = (
    options: Compute<ExactPartial<GetJettonBalanceParameters>> = {},
): GetJettonBalanceQueryKey => {
    return ['jetton-balance', filterQueryOptions(options)] as const;
};

export type GetJettonBalanceQueryKey = readonly ['jetton-balance', Compute<ExactPartial<GetJettonBalanceParameters>>];

export type GetJettonBalanceQueryOptions<selectData = GetJettonBalanceData> = QueryOptions<
    GetJettonBalanceQueryFnData,
    GetJettonBalanceErrorType,
    selectData,
    GetJettonBalanceQueryKey
>;
