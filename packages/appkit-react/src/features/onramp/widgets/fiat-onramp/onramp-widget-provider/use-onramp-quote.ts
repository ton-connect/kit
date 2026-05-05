/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';

import { useOnrampQuotes } from '../../../hooks/use-onramp-quotes';
import { useOnrampProviders } from '../../../hooks/use-onramp-providers';
import { useDebounceValue } from '../../../../../hooks/use-debounce-value';
import type { AmountInputMode, OnrampCurrency, OnrampProvider as OnrampWidgetProviderType } from '../../../types';
import type { AppkitUIToken } from '../../../../../types/appkit-ui-token';

const QUOTE_DEBOUNCE_MS = 500;

interface UseOnrampQuoteOptions {
    selectedToken: AppkitUIToken | null;
    selectedCurrency: OnrampCurrency;
    amount: string;
    amountInputMode: AmountInputMode;
}

export const useOnrampQuote = ({ selectedToken, selectedCurrency, amount, amountInputMode }: UseOnrampQuoteOptions) => {
    const [selectedProvider, setSelectedProvider] = useState<OnrampWidgetProviderType | null>(null);
    const [amountDebounced] = useDebounceValue(amount, QUOTE_DEBOUNCE_MS);

    const registeredProviders = useOnrampProviders();
    const isReversedAmountSupported = useMemo(
        () =>
            registeredProviders.length > 0 &&
            registeredProviders.every((p) => p.getMetadata().isReversedAmountSupported ?? true),
        [registeredProviders],
    );

    const {
        data: quotes,
        isFetching: isQuoteFetching,
        error: quoteError,
    } = useOnrampQuotes({
        fiatCurrency: selectedCurrency.code,
        cryptoCurrency: selectedToken?.symbol ?? 'TON',
        amount: amountDebounced || '0',
        isFiatAmount: amountInputMode === 'currency',
        query: {
            enabled: !!amountDebounced && !isNaN(parseFloat(amountDebounced)) && parseFloat(amountDebounced) > 0,
            retry: false,
            placeholderData: keepPreviousData,
            refetchOnWindowFocus: false,
        },
    });

    const providers = useMemo<OnrampWidgetProviderType[]>(
        () =>
            quotes?.map((q) => ({
                id: q.serviceInfo?.id ?? q.providerId,
                name: q.serviceInfo?.name ?? q.providerId,
                description: q.serviceInfo?.paymentMethods?.join(', ') ?? '',
                logo: q.serviceInfo?.lightLogo ?? '',
            })) ?? [],
        [quotes],
    );

    const selectedQuote = useMemo(() => {
        if (!quotes || quotes.length === 0) return undefined;
        if (selectedProvider) {
            const match = quotes.find((q) => (q.serviceInfo?.id ?? q.providerId) === selectedProvider.id);
            if (match) return match;
        }
        return quotes[0];
    }, [quotes, selectedProvider]);

    const convertedAmount = useMemo(() => {
        if (!selectedQuote) return '';
        return amountInputMode === 'currency' ? selectedQuote.cryptoAmount : selectedQuote.fiatAmount;
    }, [selectedQuote, amountInputMode]);

    useEffect(() => {
        if (selectedProvider && providers.find((p) => p.id === selectedProvider.id)) return;
        setSelectedProvider(providers[0] ?? null);
    }, [providers, selectedProvider]);

    return {
        amountDebounced,
        quotes: quotes ?? null,
        quoteError,
        isQuoteFetching,
        providers,
        selectedProvider,
        setSelectedProvider,
        selectedQuote,
        convertedAmount,
        isReversedAmountSupported,
    };
};
