/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';

import { hasTooManyDecimals } from '../../../../../utils/validate-amount';
import { mapCryptoOnrampError } from '../utils/map-crypto-onramp-error';
import type { CryptoPaymentMethod, CryptoOnrampToken } from '../../../types';
import type { CryptoAmountInputMode } from './crypto-onramp-context';

interface UseCryptoOnrampValidationOptions {
    amount: string;
    amountDebounced: string;
    amountInputMode: CryptoAmountInputMode;
    selectedMethod: CryptoPaymentMethod;
    selectedToken: CryptoOnrampToken | null;
    quoteError: Error | null;
    depositError: Error | null;
    hasQuote: boolean;
}

interface UseCryptoOnrampValidationResult {
    quoteError: string | null;
    depositError: string | null;
    canSubmit: boolean;
}

export const useCryptoOnrampValidation = ({
    amount,
    amountDebounced,
    amountInputMode,
    selectedMethod,
    selectedToken,
    quoteError,
    depositError,
    hasQuote,
}: UseCryptoOnrampValidationOptions): UseCryptoOnrampValidationResult => {
    const decimals = amountInputMode === 'method' ? selectedMethod.decimals : selectedToken?.decimals;
    const tooManyDecimals = hasTooManyDecimals(amount, decimals);

    const mappedQuoteError = useMemo(
        () => (amountDebounced && quoteError ? mapCryptoOnrampError(quoteError) : null),
        [amountDebounced, quoteError],
    );

    const mappedDepositError = useMemo(
        () => (depositError ? mapCryptoOnrampError(depositError) : null),
        [depositError],
    );

    const canSubmit =
        (parseFloat(amount) || 0) > 0 &&
        selectedToken !== null &&
        !tooManyDecimals &&
        mappedQuoteError === null &&
        mappedDepositError === null &&
        hasQuote;

    return {
        quoteError: tooManyDecimals ? 'cryptoOnramp.tooManyDecimals' : mappedQuoteError,
        depositError: mappedDepositError,
        canSubmit,
    };
};
