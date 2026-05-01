/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';

import type { AppkitUIToken } from '../../../../types/appkit-ui-token';
import { hasTooManyDecimals, isAmountExceedingBalance } from '../../../../utils/validate-amount';
import { mapSwapError } from '../../utils/map-swap-error';

interface UseSwapValidationOptions {
    fromAmount: string;
    fromAmountDebounced: string;
    fromToken: AppkitUIToken | null;
    toToken: AppkitUIToken | null;
    fromBalance: string | undefined;
    quoteError: Error | null;
    isNetworkSupported: boolean;
}

export function useSwapValidation({
    fromAmount,
    fromAmountDebounced,
    fromToken,
    toToken,
    fromBalance,
    quoteError,
    isNetworkSupported,
}: UseSwapValidationOptions) {
    const error: string | null = useMemo(() => {
        if (!isNetworkSupported) return 'defi.unsupportedNetwork';

        if ((parseFloat(fromAmount) || 0) <= 0) return null;

        if (hasTooManyDecimals(fromAmount, fromToken?.decimals)) return 'swap.tooManyDecimals';

        if (isAmountExceedingBalance(fromAmount, fromBalance)) return 'swap.insufficientBalance';

        if (quoteError && fromAmountDebounced) return mapSwapError(quoteError);

        return null;
    }, [isNetworkSupported, fromAmount, fromToken, fromBalance, quoteError, fromAmountDebounced]);

    const canSubmit = (parseFloat(fromAmount) || 0) > 0 && fromToken !== null && toToken !== null && error === null;

    return { error, canSubmit };
}
