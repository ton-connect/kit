/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { jettonsSliceLog } from '../utils';

export const formatJettonAmount = (amount: string, decimals: number): string => {
    try {
        const amountBigInt = BigInt(amount);
        const divisor = BigInt(10 ** decimals);
        const wholePart = amountBigInt / divisor;
        const fractionalPart = amountBigInt % divisor;

        if (fractionalPart === 0n) {
            return wholePart.toString();
        }

        const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
        const trimmedFractional = fractionalStr.replace(/0+$/, '');

        return trimmedFractional ? `${wholePart}.${trimmedFractional}` : wholePart.toString();
    } catch (error) {
        jettonsSliceLog.error('Error formatting jetton amount:', error);
        return '0';
    }
};
