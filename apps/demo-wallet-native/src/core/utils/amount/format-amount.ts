/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Big } from '../../libs/big-number';
import type { BigValue } from '../../libs/big-number';

export const formatAmount = (amount: BigValue, decimals?: number, toFixed?: boolean): string => {
    try {
        if (decimals || decimals === 0) {
            const fixed = Big(amount).toFixed(decimals);

            return Big(fixed)
                .plus(0)
                .toFormat(toFixed ? decimals : undefined);
        }

        return Big(amount).toFormat(decimals);
    } catch (_e) {
        return '0';
    }
};
