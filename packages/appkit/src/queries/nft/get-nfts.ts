/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NFTsResponse } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { getNfts } from '../../actions/nft/get-nfts';
import type { GetNftsOptions as GetNFTsParameters } from '../../actions/nft/get-nfts';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute, ExactPartial } from '../../types/utils';
import { filterQueryOptions } from '../../utils';

export type GetNFTsErrorType = Error;

export type GetNFTsOptions<selectData = GetNFTsData> = Compute<ExactPartial<GetNFTsParameters>> &
    QueryParameter<GetNFTsQueryFnData, GetNFTsErrorType, selectData, GetNFTsQueryKey>;

export function getNFTsQueryOptions<selectData = GetNFTsData>(
    appKit: AppKit,
    options: GetNFTsOptions<selectData> = {},
): GetNFTsQueryOptions<selectData> {
    return {
        ...options.query,
        enabled: Boolean(options.address && (options.query?.enabled ?? true)),
        queryFn: async (context) => {
            const [, parameters] = context.queryKey as [string, GetNFTsParameters];
            if (!parameters.address) throw new Error('address is required');

            const nfts = await getNfts(appKit, {
                ...(parameters as GetNFTsParameters),
                address: parameters.address,
                network: parameters.network,
                limit: parameters.limit,
                offset: parameters.offset,
            });
            return nfts;
        },
        queryKey: getNFTsQueryKey(options),
    };
}

export type GetNFTsQueryFnData = Compute<NFTsResponse>;

export type GetNFTsData = GetNFTsQueryFnData;

export function getNFTsQueryKey(options: Compute<ExactPartial<GetNFTsParameters>> = {}) {
    return ['nfts', filterQueryOptions(options)] as const;
}

export type GetNFTsQueryKey = ReturnType<typeof getNFTsQueryKey>;

export type GetNFTsQueryOptions<selectData = GetNFTsData> = QueryOptions<
    GetNFTsQueryFnData,
    GetNFTsErrorType,
    selectData,
    GetNFTsQueryKey
>;
