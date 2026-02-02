/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Big } from '../../libs/big-number';
import { formatAmount } from './format-amount';

export const formatLargeValue = (amount: string, decimals?: number): string => {
    const stringAmount = decimals !== undefined ? Big(amount).toFixed(decimals) : amount.toString();
    const intPart = stringAmount.replaceAll(' ', '').split('.')[0]?.replace(/\s/g, '') || '0';

    // value > 100 000 000 000 000 => 100 T
    if (intPart.length > 12) {
        return `${new Big(intPart.slice(0, -10)).dividedBy(100).toFormat()}T`;
    }

    // value > 100 000 000 000 => 100 B
    if (intPart.length > 9) {
        return `${new Big(intPart.slice(0, -7)).dividedBy(100).toFormat()}B`;
    }

    // value > 10 000 000 => 10 M
    if (intPart.length > 6) {
        return `${new Big(intPart.slice(0, -4)).dividedBy(100).toFormat()}M`;
    }

    return formatAmount(stringAmount, 2);
};
