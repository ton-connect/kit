/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Big } from '../../libs/big-number';
import { validateNumericString } from '../amount/validate-numeric-string';

export const validateAmount = (amount: string, balance: string, decimals?: number): boolean => {
    const isValidNumStr = validateNumericString(amount);

    if (!(isValidNumStr && amount)) {
        throw new AmountValidationError('invalid-amount');
    }

    const bigAmount = Big(amount);

    if (decimals && (bigAmount.dp() || 0) > decimals) {
        throw new AmountValidationError('decimals');
    }

    if (bigAmount.gt(balance)) {
        throw new AmountValidationError('gt-balance');
    }

    if (bigAmount.lte(0)) {
        throw new AmountValidationError('lte-zero');
    }

    return true;
};

export type AmountErrorCode = 'invalid-amount' | 'decimals' | 'gt-balance' | 'lte-zero';

export class AmountValidationError extends Error {
    code: AmountErrorCode;

    constructor(code: AmountErrorCode, message?: string) {
        super(message || code);
        this.name = 'AmountValidationError';
        this.code = code;
    }

    static isAmountValidationError(toBeDetermined: unknown): toBeDetermined is AmountValidationError {
        return (toBeDetermined as AmountValidationError)?.name === 'AmountValidationError';
    }
}
