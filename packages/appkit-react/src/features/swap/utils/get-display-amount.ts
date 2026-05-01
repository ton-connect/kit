/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { formatLargeValue } from '@ton/appkit';

/** Cap for fractional digits shown in the swap UI. */
const MAX_DISPLAY_DECIMALS = 5;

/**
 * Format a token amount for display in the swap UI.
 * Caps fractional digits at {@link MAX_DISPLAY_DECIMALS}, or at the token's own decimals when lower.
 */
export const getDisplayAmount = (amount: string | undefined, tokenDecimals?: number): string => {
    const decimals = Math.min(tokenDecimals ?? MAX_DISPLAY_DECIMALS, MAX_DISPLAY_DECIMALS);
    return formatLargeValue(amount || '0', decimals);
};
