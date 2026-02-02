/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const DOT_NUM_REGEXP = /^\d*[.]?(\d*)$/;
export const COMMA_NUM_REGEXP = /^\d*,?(\d*)$/;

export const validateNumericString = (num: string, maxDecimals?: number): boolean => {
    const isDotNum = num.includes('.');
    const isValid = isDotNum ? DOT_NUM_REGEXP.test(num) : COMMA_NUM_REGEXP.test(num);
    const match = isDotNum ? DOT_NUM_REGEXP.exec(num) : COMMA_NUM_REGEXP.exec(num);

    // if the decimals is zero the dot is not needed
    if (maxDecimals === 0 && num.includes('.')) return false;

    if (num === '.') return false;

    if (maxDecimals !== undefined && match?.[1]) return isValid && match?.[1].length <= maxDecimals;

    return isValid;
};
