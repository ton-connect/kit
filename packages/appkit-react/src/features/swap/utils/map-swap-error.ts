/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { SwapError } from '@ton/appkit';

import { mapDefiError } from '../../../utils/map-defi-error';

/**
 * Map a thrown swap error to an i18n key. Tries swap-specific codes first, falls back to the
 * shared {@link mapDefiError} for base DeFi codes, and finally to a generic `swap.quoteError`.
 */
export const mapSwapError = (error: unknown): string => {
    if (error instanceof SwapError) {
        switch (error.code) {
            case SwapError.INVALID_QUOTE:
                return 'swap.invalidQuote';
            case SwapError.INSUFFICIENT_LIQUIDITY:
                return 'swap.insufficientLiquidity';
            case SwapError.QUOTE_EXPIRED:
                return 'swap.quoteExpired';
            case SwapError.BUILD_TX_FAILED:
                return 'swap.buildTxFailed';
        }
    }

    return mapDefiError(error) ?? 'swap.quoteError';
};
