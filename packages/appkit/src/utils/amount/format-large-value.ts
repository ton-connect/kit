/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const formatLargeValue = (amount: string, decimals: number = 2, minimumFractionDigits: number = 0): string => {
    const cleanAmount = amount.toString().replace(/\s/g, '');
    const intPart = cleanAmount.split('.')[0] || '0';

    // value > 100 000 000 000 000 => 100 T
    if (intPart.length > 12) {
        const value = Number(intPart.slice(0, -10)) / 100;
        return `${value.toLocaleString('en-US')}T`;
    }

    // value > 100 000 000 000 => 100 B
    if (intPart.length > 9) {
        const value = Number(intPart.slice(0, -7)) / 100;
        return `${value.toLocaleString('en-US')}B`;
    }

    // value > 10 000 000 => 10 M
    if (intPart.length > 6) {
        const value = Number(intPart.slice(0, -4)) / 100;
        return `${value.toLocaleString('en-US')}M`;
    }

    const value = parseFloat(cleanAmount);
    if (isNaN(value)) {
        return '0';
    }

    const factor = Math.pow(10, decimals);
    const truncated = Math.floor(value * factor) / factor;

    return truncated.toLocaleString('en-US', {
        minimumFractionDigits,
        maximumFractionDigits: decimals,
    });
};
