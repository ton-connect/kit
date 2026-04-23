/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * True when `amount`'s fractional digits exceed `decimals`.
 * Returns false when `decimals` is undefined (no constraint yet known) or the amount has no fraction.
 */
export const hasTooManyDecimals = (amount: string, decimals: number | undefined): boolean => {
    if (decimals === undefined) return false;
    const fraction = amount.split('.')[1];
    return !!fraction && fraction.length > decimals;
};

/**
 * True when the parsed `amount` exceeds `balance`.
 * Returns false when `balance` is undefined (we can't yet tell) or `amount` can't be parsed.
 */
export const isAmountExceedingBalance = (amount: string | undefined, balance: string | undefined): boolean => {
    if (amount === undefined || balance === undefined) return false;
    const parsed = parseFloat(amount);
    if (Number.isNaN(parsed)) return false;
    return parsed > parseFloat(balance);
};
