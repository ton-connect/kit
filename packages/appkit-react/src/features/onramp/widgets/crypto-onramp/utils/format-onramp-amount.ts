/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { formatLargeValue, truncateDecimals } from '@ton/appkit';

const MAX_DISPLAY_DECIMALS = 5;

/**
 * Format a token amount for display in the crypto-onramp UI.
 * Truncates the fractional part to {@link MAX_DISPLAY_DECIMALS} (or the token's own decimals when
 * lower) before passing to {@link formatLargeValue} for grouping. When `decimals` is unknown,
 * falls back to `0` so we never invent precision the token may not have.
 */
export const formatOnrampAmount = (amount: string | undefined, decimals?: number): string => {
    const trimmed = truncateDecimals(amount || '0', Math.min(MAX_DISPLAY_DECIMALS, decimals ?? 0));
    return formatLargeValue(trimmed, decimals);
};
