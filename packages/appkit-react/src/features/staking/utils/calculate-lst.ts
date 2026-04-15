/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { truncateDecimals } from '@ton/appkit';

export const calculateToLst = (amount: string, lstExchangeRate?: string, lstDecimals?: number) => {
    if (!lstExchangeRate || !lstDecimals) {
        return '';
    }

    const rate = Number(lstExchangeRate);
    return truncateDecimals((Number(amount) / rate).toString(), lstDecimals);
};

export const calculateFromLst = (amount: string, lstExchangeRate?: string, mainTokenDecimals?: number) => {
    if (!lstExchangeRate || !mainTokenDecimals) {
        return '';
    }

    return truncateDecimals((Number(amount) * Number(lstExchangeRate)).toString(), mainTokenDecimals);
};
