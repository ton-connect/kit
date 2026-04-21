/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';

import type { CryptoPaymentMethod, CryptoOnrampToken } from '../../../types';
import type { CryptoAmountInputMode, CryptoOnrampWidgetError } from './crypto-onramp-widget-provider';

interface UseCryptoOnrampValidationOptions {
    amount: string;
    amountDebounced: string;
    amountInputMode: CryptoAmountInputMode;
    selectedMethod: CryptoPaymentMethod;
    selectedToken: CryptoOnrampToken | null;
    quoteError: Error | null;
    hasQuote: boolean;
}

export function useCryptoOnrampValidation({
    amount,
    amountDebounced,
    amountInputMode,
    selectedMethod,
    selectedToken,
    quoteError,
    hasQuote,
}: UseCryptoOnrampValidationOptions): { error: CryptoOnrampWidgetError; canSubmit: boolean } {
    const error: CryptoOnrampWidgetError = useMemo(() => {
        const numeric = parseFloat(amount) || 0;
        if (numeric <= 0) return null;

        const decimals = amountInputMode === 'method' ? selectedMethod.decimals : (selectedToken?.decimals ?? 9);
        const fraction = amount.split('.')[1];
        if (fraction && fraction.length > decimals) {
            return 'tooManyDecimals';
        }

        if (quoteError && amountDebounced) {
            return 'quoteError';
        }

        return null;
    }, [amount, amountDebounced, amountInputMode, selectedMethod.decimals, selectedToken?.decimals, quoteError]);

    const canSubmit = (parseFloat(amount) || 0) > 0 && selectedToken !== null && error === null && hasQuote;

    return { error, canSubmit };
}
