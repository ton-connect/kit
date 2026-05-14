/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import { getOnrampQuote } from '../../actions/onramp/get-onramp-quote';
import type { GetOnrampQuoteOptions, GetOnrampQuoteReturnType } from '../../actions/onramp/get-onramp-quote';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute, ExactPartial } from '../../types/utils';
import { filterQueryOptions } from '../../utils';

export type GetOnrampQuoteErrorType = Error;
export type GetOnrampQuoteData = GetOnrampQuoteQueryFnData;
export type GetOnrampQuoteQueryConfig<selectData = GetOnrampQuoteData> = Compute<ExactPartial<GetOnrampQuoteOptions>> &
    QueryParameter<GetOnrampQuoteQueryFnData, GetOnrampQuoteErrorType, selectData, GetOnrampQuoteQueryKey>;

export const getOnrampQuoteQueryOptions = <selectData = GetOnrampQuoteData>(
    appKit: AppKit,
    options: GetOnrampQuoteQueryConfig<selectData> = {},
): GetOnrampQuoteQueryOptions<selectData> => {
    return {
        ...options.query,
        queryFn: async (context) => {
            const [, parameters] = context.queryKey as [string, GetOnrampQuoteOptions];
            return getOnrampQuote(appKit, parameters);
        },
        queryKey: getOnrampQuoteQueryKey(options),
    };
};

export type GetOnrampQuoteQueryFnData = Compute<Awaited<GetOnrampQuoteReturnType>>;
export const getOnrampQuoteQueryKey = (
    options: Compute<ExactPartial<GetOnrampQuoteOptions>> = {},
): GetOnrampQuoteQueryKey => ['onramp-quote', filterQueryOptions(options)] as const;
export type GetOnrampQuoteQueryKey = readonly ['onramp-quote', Compute<ExactPartial<GetOnrampQuoteOptions>>];
export type GetOnrampQuoteQueryOptions<selectData = GetOnrampQuoteData> = QueryOptions<
    GetOnrampQuoteQueryFnData,
    GetOnrampQuoteErrorType,
    selectData,
    GetOnrampQuoteQueryKey
>;
