/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SwapQuote, SwapQuoteParams } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { resolveNetwork } from '../../utils';

export type GetSwapQuoteOptions<T = unknown> = SwapQuoteParams<T> & {
    providerId?: string;
};

export type GetSwapQuoteReturnType = Promise<SwapQuote>;

/**
 * Get swap quote
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
