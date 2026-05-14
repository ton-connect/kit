/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import { getSwapQuoteQueryOptions } from '@ton/appkit/queries';
import type { GetSwapQuoteData, GetSwapQuoteErrorType, GetSwapQuoteQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';
import { useNetwork } from '../../network';

/**
 * Parameters accepted by {@link useSwapQuote} — TanStack Query options (`select`, `enabled`, `staleTime`, …) plus the {@link appkit:SwapQuoteParams} fields (source/target tokens, amount, `isReverseSwap` flag) and an optional `providerId` / network override.
 *
 * @public
 * @category Type
 * @section Swap
 */
export type UseSwapQuoteParameters<selectData = GetSwapQuoteData> = GetSwapQuoteQueryConfig<selectData>;

/**
 * Return type of {@link useSwapQuote} — TanStack Query result carrying `data` ({@link appkit:SwapQuote}), `isLoading`, `error` and the standard companions.
 *
 * @public
 * @category Type
 * @section Swap
 */
export type UseSwapQuoteReturnType<selectData = GetSwapQuoteData> = UseQueryReturnType<
    selectData,
    GetSwapQuoteErrorType
>;

/**
 * Quote a swap — given source/target tokens and an amount, returns the rate, expected output and the provider-specific metadata required to feed {@link useBuildSwapTransaction}. `data` is the {@link appkit:SwapQuote} payload. The `network` field defaults to the selected wallet's network. If no wallet is selected, falls back to AppKit's default network, or mainnet when none is set.
 *
 * @param parameters - {@link UseSwapQuoteParameters} Source and target tokens, amount, optional network/provider override, and TanStack Query overrides.
 * @expand parameters
 * @returns TanStack Query result for the swap quote.
 *
 * @public
 * @category Hook
 * @section Swap
 */
export const useSwapQuote = <selectData = GetSwapQuoteData>(
    parameters: UseSwapQuoteParameters<selectData> = {},
): UseSwapQuoteReturnType<selectData> => {
    const appKit = useAppKit();
    const walletNetwork = useNetwork();

    return useQuery(getSwapQuoteQueryOptions(appKit, { ...parameters, network: parameters.network ?? walletNetwork }));
};
