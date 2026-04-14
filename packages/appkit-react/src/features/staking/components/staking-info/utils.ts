/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { formatLargeValue } from '@ton/appkit';

export const formatAmount = (amount?: string, decimals?: number) => {
    const parsedAmount = parseFloat(amount || '0');
    const trimmed = Number(parsedAmount.toFixed(Math.min(5, decimals || 9))).toString();

    return formatLargeValue(trimmed, decimals);
};
