/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Converts a number to a plain decimal string, expanding scientific notation
 * like "1.23e-9" into "0.00000000123".
 */
const toPlainDecimalString = (num: number): string => {
    const str = num.toString();
    if (!str.includes('e') && !str.includes('E')) return str;

    const [base = '0', exponent = '0'] = str.split(/[eE]/);
    const exp = Number(exponent);
    const isNegative = base.startsWith('-');
    const absBase = isNegative ? base.slice(1) : base;
    const [intPart, decPart = ''] = absBase.split('.');

    let result: string;
    if (exp < 0) {
        result = '0.' + '0'.repeat(Math.abs(exp) - 1) + intPart + decPart;
    } else {
        const addZeros = exp - decPart.length;
        if (addZeros >= 0) {
            result = intPart + decPart + '0'.repeat(addZeros);
        } else {
            result = intPart + decPart.slice(0, exp) + '.' + decPart.slice(exp);
        }
    }

    return isNegative ? '-' + result : result;
};

export const truncateDecimals = (value: string | number, maxDecimals: number): string => {
    let strValue: string;

    if (typeof value === 'number') {
        strValue = toPlainDecimalString(value);
    } else if (value.includes('e') || value.includes('E')) {
        const num = Number(value);
        if (Number.isNaN(num)) return value;
        strValue = toPlainDecimalString(num);
    } else {
        strValue = value;
    }

    const dotIndex = strValue.indexOf('.');
    if (dotIndex === -1) return strValue;

    const result = strValue.slice(0, dotIndex + 1 + maxDecimals);
    return result.endsWith('.') ? result.slice(0, -1) : result;
};
