/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';

import { formatAmount } from '../utils/amount/format-amount';
import { formatFiatAmount } from '../utils/amount/format-fiat-amount';

interface Options {
    decimals?: number;
    isDecimalsFixed?: boolean;
    isFiatToken?: boolean;
}

export const useFormattedAmount = (amount: number | string, options?: Options): string => {
    return useMemo(() => {
        if (options?.isFiatToken) return formatFiatAmount(amount, options?.decimals, options?.isDecimalsFixed);

        return formatAmount(amount, options?.decimals, options?.isDecimalsFixed);
    }, [amount, options]);
};
