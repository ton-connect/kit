/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { BigNumber } from 'bignumber.js';

import { Big } from '../../libs/big-number';
import { fromMinorUnit, toMinorUnit } from './minor-unit';

export const correctDecimals = (amount: BigNumber | string, decimals: number) => {
    const amountMinor = toMinorUnit(amount, decimals);

    if (amountMinor.toString().includes('.')) {
        const [int] = amountMinor.toString().split('.');

        if (!int) return Big(0);

        return fromMinorUnit(int, decimals);
    }

    return typeof amount === 'string' ? Big(amount) : amount;
};
