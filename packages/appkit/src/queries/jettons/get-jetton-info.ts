/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import { getJettonInfo } from '../../actions/jettons/get-jetton-info';
import type { GetJettonInfoOptions } from '../../actions/jettons/get-jetton-info';
import type { GetJettonInfoReturnType } from '../../actions/jettons/get-jetton-info';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute, ExactPartial } from '../../types/utils';
import { filterQueryOptions } from '../../utils';

export type GetJettonInfoErrorType = Error;

export type GetJettonInfoQueryConfig<selectData = GetJettonInfoData> = Compute<ExactPartial<GetJettonInfoOptions>> &
    QueryParameter<GetJettonInfoQueryFnData, GetJettonInfoErrorType, selectData, GetJettonInfoQueryKey>;

export const getJettonInfoQueryOptions = <selectData = GetJettonInfoData>(
    appKit: AppKit,
    options: GetJettonInfoQueryConfig<selectData> = {},
): GetJettonInfoQueryOptions<selectData> => {
    return {
        ...options.query,
        enabled: Boolean(options.address && (options.query?.enabled ?? true)),
        queryFn: async (context) => {
            const [, parameters] = context.queryKey as [string, GetJettonInfoOptions];
            if (!parameters.address) throw new Error('address is required');

            const jettonInfo = await getJettonInfo(appKit, parameters);
            return jettonInfo;
        },
        queryKey: getJettonInfoQueryKey(options),
    };
};

export type GetJettonInfoQueryFnData = Compute<Awaited<GetJettonInfoReturnType>>;

export type GetJettonInfoData = GetJettonInfoQueryFnData;

export const getJettonInfoQueryKey = (
    options: Compute<ExactPartial<GetJettonInfoOptions>> = {},
): GetJettonInfoQueryKey => {
    return ['jetton-info', filterQueryOptions(options)] as const;
};

export type GetJettonInfoQueryKey = readonly ['jetton-info', Compute<ExactPartial<GetJettonInfoOptions>>];

export type GetJettonInfoQueryOptions<selectData = GetJettonInfoData> = QueryOptions<
    GetJettonInfoQueryFnData,
    GetJettonInfoErrorType,
    selectData,
    GetJettonInfoQueryKey
>;
