/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UserFriendlyAddress } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { getJettonWalletAddress } from '../../actions/jettons/get-jetton-wallet-address';
import type { GetJettonWalletAddressOptions as GetJettonWalletAddressParameters } from '../../actions/jettons/get-jetton-wallet-address';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute, ExactPartial } from '../../types/utils';
import { filterQueryOptions } from '../../utils';

export type GetJettonWalletAddressErrorType = Error;

export type GetJettonWalletAddressQueryConfig<selectData = GetJettonWalletAddressData> = Compute<
    ExactPartial<GetJettonWalletAddressParameters>
> &
    QueryParameter<
        GetJettonWalletAddressQueryFnData,
        GetJettonWalletAddressErrorType,
        selectData,
        GetJettonWalletAddressQueryKey
    >;

export const getJettonWalletAddressQueryOptions = <selectData = GetJettonWalletAddressData>(
    appKit: AppKit,
    options: GetJettonWalletAddressQueryConfig<selectData> = {},
): GetJettonWalletAddressQueryOptions<selectData> => {
    return {
        ...options.query,
        enabled: Boolean(options.jettonAddress && options.ownerAddress && (options.query?.enabled ?? true)),
        queryFn: async (context) => {
            const [, parameters] = context.queryKey as [string, GetJettonWalletAddressParameters];
            if (!parameters.jettonAddress) throw new Error('jettonAddress is required');
            if (!parameters.ownerAddress) throw new Error('ownerAddress is required');

            const jettonWalletAddress = await getJettonWalletAddress(appKit, {
                ...(parameters as GetJettonWalletAddressParameters),
                jettonAddress: parameters.jettonAddress,
                ownerAddress: parameters.ownerAddress,
                network: parameters.network,
            });
            return jettonWalletAddress;
        },
        queryKey: getJettonWalletAddressQueryKey(options),
    };
};

export type GetJettonWalletAddressQueryFnData = Compute<UserFriendlyAddress>;

export type GetJettonWalletAddressData = GetJettonWalletAddressQueryFnData;

export const getJettonWalletAddressQueryKey = (
    options: Compute<ExactPartial<GetJettonWalletAddressParameters>> = {},
): GetJettonWalletAddressQueryKey => {
    return ['jetton-wallet-address', filterQueryOptions(options)] as const;
};

export type GetJettonWalletAddressQueryKey = readonly [
    'jetton-wallet-address',
    Compute<ExactPartial<GetJettonWalletAddressParameters>>,
];

export type GetJettonWalletAddressQueryOptions<selectData = GetJettonWalletAddressData> = QueryOptions<
    GetJettonWalletAddressQueryFnData,
    GetJettonWalletAddressErrorType,
    selectData,
    GetJettonWalletAddressQueryKey
>;
