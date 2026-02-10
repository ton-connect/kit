/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import { getSeqno } from '../../actions/wallet/get-seqno';
import type { GetSeqnoOptions as GetSeqnoParameters } from '../../actions/wallet/get-seqno';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute, ExactPartial } from '../../types/utils';
import { filterQueryOptions } from '../../utils';

export type GetSeqnoErrorType = Error;

export type GetSeqnoQueryConfig<selectData = GetSeqnoData> = Compute<ExactPartial<GetSeqnoParameters>> &
    QueryParameter<GetSeqnoQueryFnData, GetSeqnoErrorType, selectData, GetSeqnoQueryKey>;

export const getSeqnoQueryOptions = <selectData = GetSeqnoData>(
    appKit: AppKit,
    options: GetSeqnoQueryConfig<selectData> = {},
): GetSeqnoQueryOptions<selectData> => {
    return {
        ...options.query,
        enabled: Boolean(options.address && (options.query?.enabled ?? true)),
        queryFn: async (context) => {
            const [, parameters] = context.queryKey as [string, GetSeqnoParameters];
            if (!parameters.address) throw new Error('address is required');

            const seqno = await getSeqno(appKit, {
                ...(parameters as GetSeqnoParameters),
                address: parameters.address,
                network: parameters.network,
            });
            return seqno;
        },
        queryKey: getSeqnoQueryKey(options),
    };
};

export type GetSeqnoQueryFnData = Compute<number | null>;

export type GetSeqnoData = GetSeqnoQueryFnData;

export const getSeqnoQueryKey = (options: Compute<ExactPartial<GetSeqnoParameters>> = {}): GetSeqnoQueryKey => {
    return ['seqno', filterQueryOptions(options)] as const;
};

export type GetSeqnoQueryKey = readonly ['seqno', Compute<ExactPartial<GetSeqnoParameters>>];

export type GetSeqnoQueryOptions<selectData = GetSeqnoData> = QueryOptions<
    GetSeqnoQueryFnData,
    GetSeqnoErrorType,
    selectData,
    GetSeqnoQueryKey
>;
