/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Calculates the fiat value of a token amount.
 * Returns null when rate is unavailable or amount is zero/invalid.
 */
export const calcFiatValue = (amount: string, rate: string | undefined): string => {
    if (!rate) return '0';
    const num = parseFloat(amount);
    if (!num || num <= 0) return '0';
    return Number((num * parseFloat(rate)).toFixed(2)).toString();
};
