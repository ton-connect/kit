/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getSwapQuote } from '../../actions/swap/get-swap-quote';
import type { GetSwapQuoteOptions as GetSwapQuoteParameters } from '../../actions/swap/get-swap-quote';
import type { GetSwapQuoteReturnType } from '../../actions/swap/get-swap-quote';
import type { AppKit } from '../../core/app-kit';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute, ExactPartial } from '../../types/utils';
import { filterQueryOptions } from '../../utils';

export type GetSwapQuoteErrorType = Error;

export type GetSwapQuoteQueryConfig<selectData = GetSwapQuoteData> = Compute<ExactPartial<GetSwapQuoteParameters>> &
    QueryParameter<GetSwapQuoteQueryFnData, GetSwapQuoteErrorType, selectData, GetSwapQuoteQueryKey>;

export const getSwapQuoteQueryOptions = <selectData = GetSwapQuoteData>(
    appKit: AppKit,
    options: GetSwapQuoteQueryConfig<selectData> = {},
): GetSwapQuoteQueryOptions<selectData> => {
    return {
        ...options.query,
        enabled: Boolean(
            options.amountFrom && options.fromToken && options.toToken && (options.query?.enabled ?? true),
        ),
        queryFn: async (context) => {
            const [, parameters] = context.queryKey as [string, GetSwapQuoteParameters];
            if (!parameters.amountFrom || !parameters.fromToken || !parameters.toToken) {
                throw new Error('amountFrom, fromToken, and toToken are required');
            }

            return getSwapQuote(appKit, {
                ...(parameters as GetSwapQuoteParameters),
                amountFrom: parameters.amountFrom,
                fromToken: parameters.fromToken,
                toToken: parameters.toToken,
                amountTo: parameters.amountTo,
            });
        },
        queryKey: getSwapQuoteQueryKey(options),
        // refetchInterval: (query) => {
        //     const data = query.state.data as GetSwapQuoteData | undefined;
        //     if (!data?.expiresAt) {
        //         return false;
        //     }

        //     const now = Date.now();
        //     const expiresAt = data.expiresAt * 1000;
        //     const timeUntilExpiration = expiresAt - now;

        //     return Math.max(0, timeUntilExpiration);
        // },
    };
};

export type GetSwapQuoteQueryFnData = Compute<Awaited<GetSwapQuoteReturnType>>;

export type GetSwapQuoteData = GetSwapQuoteQueryFnData;

export const getSwapQuoteQueryKey = (
    options: Compute<ExactPartial<GetSwapQuoteParameters>> = {},
): GetSwapQuoteQueryKey => {
    return ['swapQuote', filterQueryOptions(options as unknown as Record<string, unknown>)] as const;
};

export type GetSwapQuoteQueryKey = readonly ['swapQuote', Compute<ExactPartial<GetSwapQuoteParameters>>];

export type GetSwapQuoteQueryOptions<selectData = GetSwapQuoteData> = QueryOptions<
    GetSwapQuoteQueryFnData,
    GetSwapQuoteErrorType,
    selectData,
    GetSwapQuoteQueryKey
>;
