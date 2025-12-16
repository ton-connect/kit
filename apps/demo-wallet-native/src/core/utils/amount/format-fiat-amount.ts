/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Big } from '../../libs/big-number';
import type { BigValue } from '../../libs/big-number';
import { formatAmount } from './format-amount';

export const formatFiatAmount = (amount: BigValue, decimals?: number, toFixed?: boolean): string => {
    try {
        const amountBig = Big(amount);

        if (amountBig.lt(1) && !decimals) {
            let rounded = amountBig.toPrecision(2, Big.ROUND_HALF_UP);
            const [int, dec] = rounded.split('.');

            if (dec?.endsWith('00') && dec.length > 3) {
                rounded = `${int}.${dec.slice(0, -2)}`;
            }

            const [int1, dec1] = rounded.split('.');

            if (dec1?.endsWith('0') && dec1.length > 2) {
                rounded = `${int1}.${dec1.slice(0, -1)}`;
            }

            const dp = rounded.split('.')?.[1]?.length || 2;

            return formatAmount(rounded, dp, true);
        }

        return formatAmount(amount, decimals || 2, typeof toFixed === 'boolean' ? toFixed : true);
    } catch (_e) {
        return '0';
    }
};
