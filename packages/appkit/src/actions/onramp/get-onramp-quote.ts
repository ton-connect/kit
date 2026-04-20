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

export type GetOnrampQuoteOptions<T = unknown> = OnrampQuoteParams<T> & {
    providerId?: string;
};

export type GetOnrampQuoteReturnType = Promise<OnrampQuote>;

/**
 * Get onramp quote
 */
export const getOnrampQuote = async <T = unknown>(
    appKit: AppKit,
    options: GetOnrampQuoteOptions<T>,
): GetOnrampQuoteReturnType => {
    const network = resolveNetwork(appKit, options.network);

    return appKit.onrampManager.getQuote({ ...options, network }, options.providerId);
};
