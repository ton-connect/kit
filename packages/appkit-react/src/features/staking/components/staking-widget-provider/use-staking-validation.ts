/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import type { StakingQuoteDirection, StakingQuote } from '@ton/appkit';

import { hasTooManyDecimals, isAmountExceedingBalance } from '../../../../utils/validate-amount';
import { mapStakingError } from '../../utils/map-staking-error';

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
    isNetworkSupported: boolean;
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
    isNetworkSupported,
}: UseStakingValidationOptions) => {
    const error: string | null = useMemo(() => {
        if (!isNetworkSupported) return 'defi.unsupportedNetwork';

        if ((parseFloat(amount) || 0) <= 0) return null;

        if (hasTooManyDecimals(amount, amountDecimals)) return 'staking.tooManyDecimals';

        if (direction === 'stake' && isAmountExceedingBalance(amount, balance)) {
            return 'staking.insufficientBalance';
        }

        if (direction === 'unstake') {
            // On reversed unstake the user types the TON they want to receive; compare the tsTON
            // spend (quote.amountIn) to the staked balance instead.
            const outgoingAmount = isReversed ? quote?.amountIn : amount;
            if (isAmountExceedingBalance(outgoingAmount, stakedBalance)) {
                return 'staking.insufficientBalance';
            }
        }

        if (quoteError && amountDebounced) return mapStakingError(quoteError);

        return null;
    }, [
        isNetworkSupported,
        amount,
        balance,
        quoteError,
        amountDebounced,
        direction,
        stakedBalance,
        isReversed,
        quote,
        amountDecimals,
    ]);

    const canSubmit = (parseFloat(amount) || 0) > 0 && error === null;

    return { error, canSubmit };
};
