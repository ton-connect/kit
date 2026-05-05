/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useEffect, useMemo } from 'react';
import type { FC, PropsWithChildren } from 'react';

import type { AppkitUIToken } from '../../../../../types/appkit-ui-token';
import type { TokenSectionConfig } from '../../../../../components/token-select-modal';
import type { CurrencySectionConfig } from '../../../types';
import { ONRAMP_CURRENCIES } from '../../../mock-data/currencies';
import { DEFAULT_ONRAMP_PRESETS } from '../../../constants';
import { useBuildOnrampUrl } from '../../../hooks/use-build-onramp-url';
import { useAddress } from '../../../../wallets';
import { OnrampContext } from './onramp-context';
import { useOnrampTokenState } from './use-onramp-token-state';
import { useOnrampQuote } from './use-onramp-quote';
import { useOnrampValidation } from './use-onramp-validation';

export interface OnrampProviderProps extends PropsWithChildren {
    /** Full list of tokens available for purchase */
    tokens: AppkitUIToken[];
    /** Optional section configs for grouping tokens in the selector */
    tokenSections?: TokenSectionConfig[];
    /** Optional section configs for grouping currencies in the selector */
    currencySections?: CurrencySectionConfig[];
    /** Id of the token pre-selected for purchase */
    defaultTokenId?: string;
    /** Id of the fiat currency pre-selected */
    defaultCurrencyId?: string;
}

export const OnrampWidgetProvider: FC<OnrampProviderProps> = ({
    children,
    tokens,
    tokenSections,
    currencySections,
    defaultTokenId,
    defaultCurrencyId,
}) => {
    // 1. Local state
    const {
        selectedToken,
        setSelectedToken,
        selectedCurrency,
        setSelectedCurrency,
        amount,
        setAmount,
        amountInputMode,
        setAmountInputMode,
        amountDecimals,
    } = useOnrampTokenState({ tokens, defaultTokenId, defaultCurrencyId });

    // 2. Queries and external readers
    const userAddress = useAddress();

    const {
        amountDebounced,
        quoteError,
        isQuoteFetching,
        providers,
        selectedProvider,
        setSelectedProvider,
        selectedQuote,
        convertedAmount,
        isReversedAmountSupported,
    } = useOnrampQuote({ selectedToken, selectedCurrency, amount, amountInputMode });

    // 3. Derivations
    const { error, canSubmit } = useOnrampValidation({
        amount,
        amountDebounced,
        amountDecimals,
        quoteError,
        hasQuote: !!selectedQuote,
        hasSelectedProvider: !!selectedProvider,
    });

    const isLoadingQuote = isQuoteFetching || amount !== amountDebounced;

    useEffect(() => {
        if (!isReversedAmountSupported && amountInputMode === 'token') {
            setAmountInputMode('currency');
        }
    }, [isReversedAmountSupported, amountInputMode, setAmountInputMode]);

    // 4. Mutations
    const { mutateAsync: buildUrl } = useBuildOnrampUrl();

    // 5. Callbacks
    const onContinue = useCallback(async () => {
        if (!canSubmit || !selectedQuote || !userAddress) return;

        try {
            const url = await buildUrl({ quote: selectedQuote, userAddress });
            window.open(url, '_blank');
        } catch {
            // silently swallow — redirect is best-effort
        }
    }, [canSubmit, selectedQuote, userAddress, buildUrl]);

    const onReset = useCallback(() => {
        setAmount('');
        setAmountInputMode('currency');
    }, [setAmount, setAmountInputMode]);

    const value = useMemo(
        () => ({
            tokens,
            tokenSections,
            selectedToken,
            setSelectedToken,
            currencies: ONRAMP_CURRENCIES,
            currencySections,
            selectedCurrency,
            setSelectedCurrency,
            amount,
            setAmount,
            amountInputMode,
            setAmountInputMode,
            convertedAmount,
            presetAmounts: DEFAULT_ONRAMP_PRESETS,
            providers,
            selectedProvider,
            setSelectedProvider,
            selectedQuote,
            isReversedAmountSupported,
            error,
            isLoadingQuote,
            canSubmit,
            onReset,
            onContinue,
        }),
        [
            tokens,
            tokenSections,
            selectedToken,
            setSelectedToken,
            currencySections,
            selectedCurrency,
            setSelectedCurrency,
            amount,
            setAmount,
            amountInputMode,
            setAmountInputMode,
            convertedAmount,
            providers,
            selectedProvider,
            setSelectedProvider,
            selectedQuote,
            isReversedAmountSupported,
            error,
            isLoadingQuote,
            canSubmit,
            onReset,
            onContinue,
        ],
    );

    return <OnrampContext.Provider value={value}>{children}</OnrampContext.Provider>;
};
