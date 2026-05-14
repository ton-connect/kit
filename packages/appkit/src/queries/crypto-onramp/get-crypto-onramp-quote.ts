/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import { getCryptoOnrampQuote } from '../../actions/crypto-onramp/get-crypto-onramp-quote';
import type {
    GetCryptoOnrampQuoteOptions,
    GetCryptoOnrampQuoteReturnType,
} from '../../actions/crypto-onramp/get-crypto-onramp-quote';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute, ExactPartial } from '../../types/utils';
import { filterQueryOptions } from '../../utils';

export type GetCryptoOnrampQuoteErrorType = Error;
export type GetCryptoOnrampQuoteData = GetCryptoOnrampQuoteQueryFnData;
export type GetCryptoOnrampQuoteQueryConfig<selectData = GetCryptoOnrampQuoteData> = Compute<
    ExactPartial<GetCryptoOnrampQuoteOptions>
> &
    QueryParameter<
        GetCryptoOnrampQuoteQueryFnData,
        GetCryptoOnrampQuoteErrorType,
        selectData,
        GetCryptoOnrampQuoteQueryKey
    >;

export const getCryptoOnrampQuoteQueryOptions = <selectData = GetCryptoOnrampQuoteData>(
    appKit: AppKit,
    options: GetCryptoOnrampQuoteQueryConfig<selectData> = {},
): GetCryptoOnrampQuoteQueryOptions<selectData> => {
    return {
        ...options.query,
        queryFn: async (context) => {
            const [, parameters] = context.queryKey as [string, GetCryptoOnrampQuoteOptions];
            return getCryptoOnrampQuote(appKit, parameters);
        },
        queryKey: getCryptoOnrampQuoteQueryKey(options),
    };
};

export type GetCryptoOnrampQuoteQueryFnData = Compute<Awaited<GetCryptoOnrampQuoteReturnType>>;
export const getCryptoOnrampQuoteQueryKey = (
    options: Compute<ExactPartial<GetCryptoOnrampQuoteOptions>> = {},
): GetCryptoOnrampQuoteQueryKey => ['crypto-onramp-quote', filterQueryOptions(options)] as const;
export type GetCryptoOnrampQuoteQueryKey = readonly [
    'crypto-onramp-quote',
    Compute<ExactPartial<GetCryptoOnrampQuoteOptions>>,
];
export type GetCryptoOnrampQuoteQueryOptions<selectData = GetCryptoOnrampQuoteData> = QueryOptions<
    GetCryptoOnrampQuoteQueryFnData,
    GetCryptoOnrampQuoteErrorType,
    selectData,
    GetCryptoOnrampQuoteQueryKey
>;
