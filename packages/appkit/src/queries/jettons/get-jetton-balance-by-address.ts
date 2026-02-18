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

export type GetJettonBalanceByAddressData = GetJettonBalanceQueryFnData;

export type GetJettonBalanceByAddressQueryConfig<selectData = GetJettonBalanceByAddressData> = Compute<
    ExactPartial<GetJettonBalanceParameters>
> &
    QueryParameter<
        GetJettonBalanceQueryFnData,
        GetJettonBalanceErrorType,
        selectData,
        GetJettonBalanceByAddressQueryKey
    >;

export const getJettonBalanceByAddressQueryOptions = <selectData = GetJettonBalanceByAddressData>(
    appKit: AppKit,
    options: GetJettonBalanceByAddressQueryConfig<selectData> = {},
): GetJettonBalanceByAddressQueryOptions<selectData> => {
    return {
        ...options.query,
        enabled: Boolean(options.jettonAddress && options.ownerAddress && (options.query?.enabled ?? true)),
        queryFn: async (context) => {
            const [, parameters] = context.queryKey as [string, GetJettonBalanceParameters];
            if (!parameters.jettonAddress) throw new Error('jettonAddress is required');
            if (!parameters.ownerAddress) throw new Error('ownerAddress is required');

            const balance = await getJettonBalance(appKit, parameters);
            return balance;
        },
        queryKey: getJettonBalanceByAddressQueryKey(options),
    };
};

export type GetJettonBalanceQueryFnData = Compute<TokenAmount>;

export const getJettonBalanceByAddressQueryKey = (
    options: Compute<ExactPartial<GetJettonBalanceParameters>> = {},
): GetJettonBalanceByAddressQueryKey => {
    return ['jetton-balance', filterQueryOptions(options)] as const;
};

export type GetJettonBalanceByAddressQueryKey = readonly [
    'jetton-balance',
    Compute<ExactPartial<GetJettonBalanceParameters>>,
];

export type GetJettonBalanceByAddressQueryOptions<selectData = GetJettonBalanceByAddressData> = QueryOptions<
    GetJettonBalanceQueryFnData,
    GetJettonBalanceErrorType,
    selectData,
    GetJettonBalanceByAddressQueryKey
>;
