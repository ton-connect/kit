/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';

import { hasTooManyDecimals } from '../../../../../utils/validate-amount';
import { mapOnrampError } from '../utils/map-onramp-error';

interface UseOnrampValidationOptions {
    amount: string;
    amountDebounced: string;
    amountDecimals?: number;
    quoteError: Error | null;
    hasQuote: boolean;
    hasSelectedProvider: boolean;
}

interface UseOnrampValidationResult {
    error: string | null;
    canSubmit: boolean;
}

export const useOnrampValidation = ({
    amount,
    amountDebounced,
    amountDecimals,
    quoteError,
    hasQuote,
    hasSelectedProvider,
}: UseOnrampValidationOptions): UseOnrampValidationResult => {
    const tooManyDecimals = hasTooManyDecimals(amount, amountDecimals);

    const mappedError = useMemo(() => {
        if (tooManyDecimals) return 'onramp.tooManyDecimals';
        if (quoteError && amountDebounced) return mapOnrampError(quoteError);
        return null;
    }, [tooManyDecimals, quoteError, amountDebounced]);

    const canSubmit =
        (parseFloat(amount) || 0) > 0 && !tooManyDecimals && mappedError === null && hasQuote && hasSelectedProvider;

    return { error: mappedError, canSubmit };
};
