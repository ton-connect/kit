/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { OnrampQuote, OnrampQuoteParams } from '@ton/walletkit';

import { resolveNetwork } from '../../utils';
import type { AppKit } from '../../core/app-kit';

export type GetOnrampQuotesOptions<T = unknown> = OnrampQuoteParams<T>;

export type GetOnrampQuotesReturnType = Promise<OnrampQuote[]>;

/**
 * Get onramp quotes from all registered providers (results are flattened).
 */
export const getOnrampQuotes = async <T = unknown>(
    appKit: AppKit,
    options: GetOnrampQuotesOptions<T>,
): GetOnrampQuotesReturnType => {
    const network = resolveNetwork(appKit, options.network);

    return appKit.onrampManager.getQuotes({ ...options, network });
};
