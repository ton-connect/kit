/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import type { StakingQuoteDirection } from '@ton/appkit';

import type { StakingWidgetError } from './staking-widget-provider';

interface UseStakingValidationOptions {
    amount: string;
    amountDebounced: string;
    balance: string | undefined;
    quoteError: Error | null;
    direction: StakingQuoteDirection;
    stakedBalance?: string;
}

export const useStakingValidation = ({
    amount,
    amountDebounced,
    balance,
    quoteError,
    direction,
    stakedBalance,
}: UseStakingValidationOptions) => {
    const error: StakingWidgetError = useMemo(() => {
        const parsed = parseFloat(amount) || 0;
        if (parsed <= 0) return null;

        const fraction = amount.split('.')[1];
        if (fraction && fraction.length > 9) {
            return 'tooManyDecimals';
        }

        const maxAmount = direction === 'unstake' ? stakedBalance : balance;

        if (maxAmount !== undefined && parsed > parseFloat(maxAmount)) {
            return 'insufficientBalance';
        }

        if (quoteError && amountDebounced) {
            return 'quoteError';
        }

        return null;
    }, [amount, balance, quoteError, amountDebounced, direction, stakedBalance]);

    const canSubmit = (parseFloat(amount) || 0) > 0 && error === null;

    return { error, canSubmit };
};
