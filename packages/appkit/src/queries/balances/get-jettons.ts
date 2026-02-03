/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { JettonsResponse } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { getJettons } from '../../actions/balances/get-jettons';
import type { GetJettonsOptions as GetJettonsParameters } from '../../actions/balances/get-jettons';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute, ExactPartial } from '../../types/utils';
import { filterQueryOptions } from '../../utils';

export type GetJettonsErrorType = Error;

export type GetJettonsOptions<selectData = GetJettonsData> = Compute<ExactPartial<GetJettonsParameters>> &
    QueryParameter<GetJettonsQueryFnData, GetJettonsErrorType, selectData, GetJettonsQueryKey>;

export function getJettonsQueryOptions<selectData = GetJettonsData>(
    appKit: AppKit,
    options: GetJettonsOptions<selectData> = {},
): GetJettonsQueryOptions<selectData> {
    return {
        ...options.query,
        enabled: Boolean(options.address && (options.query?.enabled ?? true)),
        queryFn: async (context) => {
            const [, parameters] = context.queryKey as [string, GetJettonsParameters];
            if (!parameters.address) throw new Error('address is required');

            const jettons = await getJettons(appKit, {
                ...(parameters as GetJettonsParameters),
                address: parameters.address,
                network: parameters.network,
                limit: parameters.limit,
                offset: parameters.offset,
            });
            return jettons;
        },
        queryKey: getJettonsQueryKey(options),
    };
}

export type GetJettonsQueryFnData = Compute<JettonsResponse>;

export type GetJettonsData = GetJettonsQueryFnData;

export function getJettonsQueryKey(options: Compute<ExactPartial<GetJettonsParameters>> = {}) {
    return ['jettons', filterQueryOptions(options)] as const;
}

export type GetJettonsQueryKey = ReturnType<typeof getJettonsQueryKey>;

export type GetJettonsQueryOptions<selectData = GetJettonsData> = QueryOptions<
    GetJettonsQueryFnData,
    GetJettonsErrorType,
    selectData,
    GetJettonsQueryKey
>;
