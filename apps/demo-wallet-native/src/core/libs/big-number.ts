/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { BigNumber } from 'bignumber.js';

BigNumber.config({
    DECIMAL_PLACES: 50,
    EXPONENTIAL_AT: 50,
    ROUNDING_MODE: BigNumber.ROUND_DOWN,
    FORMAT: {
        prefix: '',
        decimalSeparator: '.',
        groupSeparator: '',
        groupSize: 3,
        secondaryGroupSize: 0,
        fractionGroupSeparator: '',
        fractionGroupSize: 0,
        suffix: '',
    },
});

export const Big = BigNumber;
export type BigValue = BigNumber.Value;
