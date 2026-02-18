/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NFT } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { getNft } from '../../actions/nft/get-nft';
import type { GetNftOptions as GetNftParameters } from '../../actions/nft/get-nft';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute, ExactPartial } from '../../types/utils';
import { filterQueryOptions } from '../../utils';

export type GetNftErrorType = Error;

export type GetNftQueryConfig<selectData = GetNftData> = Compute<ExactPartial<GetNftParameters>> &
    QueryParameter<GetNftQueryFnData, GetNftErrorType, selectData, GetNftQueryKey>;

export const getNftQueryOptions = <selectData = GetNftData>(
    appKit: AppKit,
    options: GetNftQueryConfig<selectData> = {},
): GetNftQueryOptions<selectData> => {
    return {
        ...options.query,
        enabled: Boolean(options.address && (options.query?.enabled ?? true)),
        queryFn: async (context) => {
            const [, parameters] = context.queryKey as [string, GetNftParameters];
            if (!parameters.address) throw new Error('address is required');

            const nft = await getNft(appKit, parameters);
            return nft;
        },
        queryKey: getNftQueryKey(options),
    };
};

export type GetNftQueryFnData = Compute<NFT | null>;

export type GetNftData = GetNftQueryFnData;

export const getNftQueryKey = (options: Compute<ExactPartial<GetNftParameters>> = {}): GetNftQueryKey => {
    return ['nft', filterQueryOptions(options)] as const;
};

export type GetNftQueryKey = readonly ['nft', Compute<ExactPartial<GetNftParameters>>];

export type GetNftQueryOptions<selectData = GetNftData> = QueryOptions<
    GetNftQueryFnData,
    GetNftErrorType,
    selectData,
    GetNftQueryKey
>;
