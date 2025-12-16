/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { BigNumber } from 'bignumber.js';

import { Big } from '../../libs/big-number';
import type { BigValue } from '../../libs/big-number';

// 0.00001 -> 1
export const toMinorUnit = (amount: string | BigValue | number, decimals: number): BigNumber =>
    new Big(amount).multipliedBy(`1e${decimals}`);

// 1 -> 0.00001
export const fromMinorUnit = (amount: string | BigValue | number, decimals: number): BigNumber =>
    new Big(amount).multipliedBy(`1e-${decimals}`);
