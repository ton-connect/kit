/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import { getOnrampQuotes } from '../../actions/onramp/get-onramp-quotes';
import type { GetOnrampQuotesOptions, GetOnrampQuotesReturnType } from '../../actions/onramp/get-onramp-quotes';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute, ExactPartial } from '../../types/utils';
import { filterQueryOptions } from '../../utils';

export type GetOnrampQuotesErrorType = Error;
export type GetOnrampQuotesData = GetOnrampQuotesQueryFnData;
export type GetOnrampQuotesQueryConfig<selectData = GetOnrampQuotesData> = Compute<
    ExactPartial<GetOnrampQuotesOptions>
> &
    QueryParameter<GetOnrampQuotesQueryFnData, GetOnrampQuotesErrorType, selectData, GetOnrampQuotesQueryKey>;

export const getOnrampQuotesQueryOptions = <selectData = GetOnrampQuotesData>(
    appKit: AppKit,
    options: GetOnrampQuotesQueryConfig<selectData> = {},
): GetOnrampQuotesQueryOptions<selectData> => {
    return {
        ...options.query,
        queryFn: async (context) => {
            const [, parameters] = context.queryKey as [string, GetOnrampQuotesOptions];
            return getOnrampQuotes(appKit, parameters);
        },
        queryKey: getOnrampQuotesQueryKey(options),
    };
};

export type GetOnrampQuotesQueryFnData = Compute<Awaited<GetOnrampQuotesReturnType>>;
export const getOnrampQuotesQueryKey = (
    options: Compute<ExactPartial<GetOnrampQuotesOptions>> = {},
): GetOnrampQuotesQueryKey => ['onramp-quotes', filterQueryOptions(options)] as const;
export type GetOnrampQuotesQueryKey = readonly ['onramp-quotes', Compute<ExactPartial<GetOnrampQuotesOptions>>];
export type GetOnrampQuotesQueryOptions<selectData = GetOnrampQuotesData> = QueryOptions<
    GetOnrampQuotesQueryFnData,
    GetOnrampQuotesErrorType,
    selectData,
    GetOnrampQuotesQueryKey
>;
