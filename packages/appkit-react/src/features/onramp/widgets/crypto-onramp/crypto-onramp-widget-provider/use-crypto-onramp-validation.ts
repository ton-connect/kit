/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import { CryptoOnrampError } from '@ton/appkit';

import type { CryptoPaymentMethod, CryptoOnrampToken } from '../../../types';
import type { CryptoAmountInputMode } from './crypto-onramp-widget-provider';
import { useI18n } from '../../../../settings/hooks/use-i18n';

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

const mapCryptoOnrampError = (err: Error | null, t: ReturnType<typeof useI18n>['t']): string | null => {
    if (!err) return null;

    if (err instanceof CryptoOnrampError) {
        switch (err.code) {
            case CryptoOnrampError.INVALID_REFUND_ADDRESS:
                return t('cryptoOnramp.invalidRefundAddress');
            case CryptoOnrampError.QUOTE_FAILED:
                return t('cryptoOnramp.quoteError');
            case CryptoOnrampError.PROVIDER_ERROR:
                return t('cryptoOnramp.providerError');
            case CryptoOnrampError.DEPOSIT_FAILED:
                return t('cryptoOnramp.depositFailed');
        }
    }

    // Handle DefiManagerError codes and others if err has a code property
    const code = (err as { code?: string })?.code;
    if (code) {
        switch (code) {
            case 'NETWORK_ERROR':
                return t('cryptoOnramp.networkError');
            case 'INVALID_PARAMS':
                return t('cryptoOnramp.invalidParams');
            case 'PROVIDER_NOT_FOUND':
            case 'NO_DEFAULT_PROVIDER':
            case 'INVALID_PROVIDER':
                return t('cryptoOnramp.providerError');
        }
    }

    return t('cryptoOnramp.genericError');
};

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
    const { t } = useI18n();

    const hasTooManyDecimals = useMemo(() => {
        const numeric = parseFloat(amount) || 0;
        if (numeric <= 0) return false;

        const decimals = amountInputMode === 'method' ? selectedMethod.decimals : (selectedToken?.decimals ?? 9);
        const fraction = amount.split('.')[1];
        return !!fraction && fraction.length > decimals;
    }, [amount, amountInputMode, selectedMethod.decimals, selectedToken?.decimals]);

    const mappedQuoteError = useMemo(
        () => (amountDebounced ? mapCryptoOnrampError(quoteError, t) : null),
        [amountDebounced, quoteError],
    );

    const mappedDepositError = useMemo(() => mapCryptoOnrampError(depositError, t), [depositError]);

    const canSubmit =
        (parseFloat(amount) || 0) > 0 &&
        selectedToken !== null &&
        !hasTooManyDecimals &&
        mappedQuoteError === null &&
        mappedDepositError === null &&
        hasQuote;

    return {
        quoteError: hasTooManyDecimals ? t('cryptoOnramp.tooManyDecimals') : mappedQuoteError,
        depositError: mappedDepositError,
        canSubmit,
    };
};
