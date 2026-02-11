/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import { getSeqno } from '../../actions/wallet/get-seqno';
import type { GetSeqnoOptions } from '../../actions/wallet/get-seqno';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute, ExactPartial } from '../../types/utils';
import { filterQueryOptions } from '../../utils';

export type GetSeqnoErrorType = Error;

export type GetSeqnoByAddressData = GetSeqnoQueryFnData;

export type GetSeqnoByAddressQueryConfig<selectData = GetSeqnoByAddressData> = Compute<ExactPartial<GetSeqnoOptions>> &
    QueryParameter<GetSeqnoQueryFnData, GetSeqnoErrorType, selectData, GetSeqnoByAddressQueryKey>;

export const getSeqnoByAddressQueryOptions = <selectData = GetSeqnoByAddressData>(
    appKit: AppKit,
    options: GetSeqnoByAddressQueryConfig<selectData> = {},
): GetSeqnoByAddressQueryOptions<selectData> => {
    return {
        ...options.query,
        enabled: Boolean(options.address && (options.query?.enabled ?? true)),
        queryFn: async (context) => {
            const [, parameters] = context.queryKey as [string, GetSeqnoOptions];
            if (!parameters.address) throw new Error('address is required');

            const seqno = await getSeqno(appKit, parameters);
            return seqno;
        },
        queryKey: getSeqnoByAddressQueryKey(options),
    };
};

export type GetSeqnoQueryFnData = Compute<number | null>;

export const getSeqnoByAddressQueryKey = (
    options: Compute<ExactPartial<GetSeqnoOptions>> = {},
): GetSeqnoByAddressQueryKey => {
    return ['seqno', filterQueryOptions(options)] as const;
};

export type GetSeqnoByAddressQueryKey = readonly ['seqno', Compute<ExactPartial<GetSeqnoOptions>>];

export type GetSeqnoByAddressQueryOptions<selectData = GetSeqnoByAddressData> = QueryOptions<
    GetSeqnoQueryFnData,
    GetSeqnoErrorType,
    selectData,
    GetSeqnoByAddressQueryKey
>;
