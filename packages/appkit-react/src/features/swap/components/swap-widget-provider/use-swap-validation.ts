/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';

import type { AppkitUIToken } from '../../../../types/appkit-ui-token';
import type { SwapWidgetError } from './swap-widget-provider';

interface UseSwapValidationOptions {
    fromAmount: string;
    fromAmountDebounced: string;
    fromToken: AppkitUIToken | null;
    toToken: AppkitUIToken | null;
    fromBalance: string | undefined;
    quoteError: Error | null;
}

export function useSwapValidation({
    fromAmount,
    fromAmountDebounced,
    fromToken,
    toToken,
    fromBalance,
    quoteError,
}: UseSwapValidationOptions) {
    const error: SwapWidgetError = useMemo(() => {
        const amount = parseFloat(fromAmount) || 0;
        if (amount <= 0) return null;

        const fraction = fromAmount.split('.')[1];
        if (fraction && fromToken && fraction.length > fromToken.decimals) {
            return 'tooManyDecimals';
        }

        if (fromBalance !== undefined && amount > parseFloat(fromBalance)) {
            return 'insufficientBalance';
        }

        if (quoteError && fromAmountDebounced) {
            return 'quoteError';
        }

        return null;
    }, [fromAmount, fromToken, fromBalance, quoteError, fromAmountDebounced]);

    const canSubmit = (parseFloat(fromAmount) || 0) > 0 && fromToken !== null && toToken !== null && error === null;

    return { error, canSubmit };
}
