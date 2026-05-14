/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { SwapQuote, SwapQuoteParams } from '../../swap';
import { resolveNetwork } from '../../utils';

/**
 * Options for {@link getSwapQuote} — extends {@link SwapQuoteParams} with an optional provider override.
 *
 * @public
 * @category Type
 * @section Swap
 */
export type GetSwapQuoteOptions<T = unknown> = SwapQuoteParams<T> & {
    /** Provider to quote against. Defaults to the registered default swap provider. */
    providerId?: string;
};

/**
 * Return type of {@link getSwapQuote}.
 *
 * @public
 * @category Type
 * @section Swap
 */
export type GetSwapQuoteReturnType = Promise<SwapQuote>;

/**
 * Quote a swap — given source/target tokens and an amount, returns the rate, expected output and provider metadata needed to call {@link buildSwapTransaction}.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link GetSwapQuoteOptions} Source and target tokens, amount, optional network and provider override.
 * @returns Quote with pricing details and the provider metadata required to build a transaction.
 *
 * @sample docs/examples/src/appkit/actions/swap#GET_SWAP_QUOTE
 * @expand options
 *
 * @public
 * @category Action
 * @section Swap
 */
export const getSwapQuote = async <T = unknown>(
    appKit: AppKit,
    options: GetSwapQuoteOptions<T>,
): GetSwapQuoteReturnType => {
    const optionsWithNetwork = {
        ...options,
        network: resolveNetwork(appKit, options.network),
    };

    return appKit.swapManager.getQuote(optionsWithNetwork, options.providerId);
};
