/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import type { StakingQuoteDirection, StakingQuote } from '@ton/appkit';

import type { StakingWidgetError } from './staking-widget-provider';

interface UseStakingValidationOptions {
    amount: string;
    amountDebounced: string;
    balance: string | undefined;
    quote?: StakingQuote;
    quoteError: Error | null;
    direction: StakingQuoteDirection;
    amountDecimals?: number;
    isReversed: boolean;
    stakedBalance?: string;
}

export const useStakingValidation = ({
    amount,
    amountDebounced,
    balance,
    quote,
    quoteError,
    direction,
    amountDecimals,
    isReversed,
    stakedBalance,
}: UseStakingValidationOptions) => {
    const error: StakingWidgetError = useMemo(() => {
        const parsed = parseFloat(amount) || 0;
        if (parsed <= 0) return null;

        const fraction = amount.split('.')[1];
        if (fraction && amountDecimals && fraction.length > amountDecimals) {
            return 'tooManyDecimals';
        }

        if (direction === 'stake' && balance !== undefined && parsed > parseFloat(balance)) {
            return 'insufficientBalance';
        }

        if (direction === 'unstake' && stakedBalance) {
            if (!isReversed && parsed > parseFloat(stakedBalance)) {
                return 'insufficientBalance';
            }

            if (isReversed && quote && parseFloat(quote.amountIn) > parseFloat(stakedBalance)) {
                return 'insufficientBalance';
            }
        }

        if (quoteError && amountDebounced) {
            return 'quoteError';
        }

        return null;
    }, [amount, balance, quoteError, amountDebounced, direction, stakedBalance, isReversed, quote, amountDecimals]);

    const canSubmit = (parseFloat(amount) || 0) > 0 && error === null;

    return { error, canSubmit };
};
