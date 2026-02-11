/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NFTsResponse } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { getNftsByAddress } from '../../actions/nft/get-nfts-by-address';
import type { GetNftsByAddressOptions } from '../../actions/nft/get-nfts-by-address';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute, ExactPartial } from '../../types/utils';
import { filterQueryOptions } from '../../utils';

export type GetNFTsErrorType = Error;

export type GetNFTsByAddressData = GetNFTsQueryFnData;

export type GetNFTsByAddressQueryConfig<selectData = GetNFTsByAddressData> = Compute<
    ExactPartial<GetNftsByAddressOptions>
> &
    QueryParameter<GetNFTsQueryFnData, GetNFTsErrorType, selectData, GetNFTsByAddressQueryKey>;

export const getNFTsByAddressQueryOptions = <selectData = GetNFTsByAddressData>(
    appKit: AppKit,
    options: GetNFTsByAddressQueryConfig<selectData> = {},
): GetNFTsByAddressQueryOptions<selectData> => {
    return {
        ...options.query,
        enabled: Boolean(options.address && (options.query?.enabled ?? true)),
        queryFn: async (context) => {
            const [, parameters] = context.queryKey as [string, GetNftsByAddressOptions];
            if (!parameters.address) throw new Error('address is required');

            const nfts = await getNftsByAddress(appKit, parameters);
            return nfts;
        },
        queryKey: getNFTsByAddressQueryKey(options),
    };
};

export type GetNFTsQueryFnData = Compute<NFTsResponse>;

export const getNFTsByAddressQueryKey = (
    options: Compute<ExactPartial<GetNftsByAddressOptions>> = {},
): GetNFTsByAddressQueryKey => {
    return ['nfts', filterQueryOptions(options)] as const;
};

export type GetNFTsByAddressQueryKey = readonly ['nfts', Compute<ExactPartial<GetNftsByAddressOptions>>];

export type GetNFTsByAddressQueryOptions<selectData = GetNFTsByAddressData> = QueryOptions<
    GetNFTsQueryFnData,
    GetNFTsErrorType,
    selectData,
    GetNFTsByAddressQueryKey
>;
