/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { FC, PropsWithChildren } from 'react';
import type { OnrampQuote } from '@ton/appkit/onramp';

import type { AppkitUIToken } from '../../../../../types/appkit-ui-token';
import type { TokenSectionConfig } from '../../../../../components/token-select-modal';
import type {
    OnrampCurrency,
    OnrampProvider as OnrampWidgetProviderType,
    AmountInputMode,
    OnrampAmountPreset,
    CurrencySectionConfig,
} from '../../../types';
import { ONRAMP_CURRENCIES } from '../../../mock-data/currencies';
import { DEFAULT_ONRAMP_PRESETS } from '../../../constants';
import { useOnrampQuotes } from '../../../hooks/use-onramp-quotes';
import { useOnrampProviders } from '../../../hooks/use-onramp-providers';
import { useBuildOnrampUrl } from '../../../hooks/use-build-onramp-url';
import { useConnectedWallets } from '../../../../wallets/hooks/use-connected-wallets';
import { useDebounceValue } from '../../../../../hooks/use-debounce-value';

export type { AppkitUIToken };

const ERROR_THRESHOLD = 10000000;
const QUOTE_DEBOUNCE_MS = 500;

export interface OnrampContextType {
    /** Full list of available tokens to buy */
    tokens: AppkitUIToken[];
    /** Optional section configs for grouping tokens in the selector */
    tokenSections?: TokenSectionConfig[];
    /** Optional section configs for grouping currencies in the selector */
    currencySections?: CurrencySectionConfig[];
    /** Currently selected token to buy */
    selectedToken: AppkitUIToken | null;
    /** Select a token to buy */
    setSelectedToken: (token: AppkitUIToken) => void;

    /** Available fiat currencies */
    currencies: OnrampCurrency[];
    /** Currently selected fiat currency */
    selectedCurrency: OnrampCurrency;
    /** Select a fiat currency */
    setSelectedCurrency: (currency: OnrampCurrency) => void;

    /** Current amount input value */
    amount: string;
    /** Set the amount value */
    setAmount: (value: string) => void;
    /** Whether user is entering token amount or fiat amount */
    amountInputMode: AmountInputMode;
    /** Switch between token / currency input mode */
    setAmountInputMode: (mode: AmountInputMode) => void;
    /** Mocked converted amount in the opposite denomination */
    convertedAmount: string;
    /** Preset amount values */
    presetAmounts: OnrampAmountPreset[];

    /** Available payment providers */
    providers: OnrampWidgetProviderType[];
    /** Currently selected provider */
    selectedProvider: OnrampWidgetProviderType | null;
    /** Select a provider */
    setSelectedProvider: (provider: OnrampWidgetProviderType) => void;
    /** Quote tied to the currently selected provider */
    selectedQuote?: OnrampQuote;
    /** Whether the registered providers support reversed (crypto-amount) quotes */
    isReversedAmountSupported: boolean;

    /** Whether amount is valid and user can proceed */
    canContinue: boolean;
    /** Current error, e.g. 'noQuotesFound' */
    error?: string;
    /** Loading state for quotes */
    isLoading: boolean;
    /** Reset widget to initial state */
    onReset: () => void;
    /** Execute the onramp (build URL and redirect) */
    onContinue: () => void;
}

const defaultContext: OnrampContextType = {
    tokens: [],
    tokenSections: undefined,
    currencySections: undefined,
    selectedToken: null,
    setSelectedToken: () => {},
    currencies: [],
    selectedCurrency: ONRAMP_CURRENCIES[0]!,
    setSelectedCurrency: () => {},
    amount: '',
    setAmount: () => {},
    amountInputMode: 'currency',
    setAmountInputMode: () => {},
    convertedAmount: '',
    presetAmounts: DEFAULT_ONRAMP_PRESETS,
    providers: [],
    selectedProvider: null,
    setSelectedProvider: () => {},
    selectedQuote: undefined,
    isReversedAmountSupported: false,
    canContinue: false,
    error: undefined,
    isLoading: false,
    onReset: () => {},
    onContinue: () => {},
};

export const OnrampContext = createContext<OnrampContextType>(defaultContext);

export const useOnrampContext = () => {
    return useContext(OnrampContext);
};

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
    const [selectedToken, setSelectedToken] = useState<AppkitUIToken | null>(
        () => tokens.find((t) => t.id === defaultTokenId) ?? tokens[0] ?? null,
    );

    const [selectedCurrency, setSelectedCurrency] = useState<OnrampCurrency>(
        () => ONRAMP_CURRENCIES.find((c) => c.id === defaultCurrencyId) ?? ONRAMP_CURRENCIES[0]!,
    );

    const [amount, setAmount] = useState('');
    const [amountInputMode, setAmountInputMode] = useState<AmountInputMode>('currency');
    const [selectedProvider, setSelectedProvider] = useState<OnrampWidgetProviderType | null>(null);

    const registeredProviders = useOnrampProviders();
    const isReversedAmountSupported = useMemo(
        () =>
            registeredProviders.length > 0 &&
            registeredProviders.every((p) => p.getMetadata().isReversedAmountSupported ?? true),
        [registeredProviders],
    );

    const [amountDebounced] = useDebounceValue(amount, QUOTE_DEBOUNCE_MS);

    const {
        data: quotes,
        isLoading: isQuoteLoading,
        error: quotesError,
    } = useOnrampQuotes({
        fiatCurrency: selectedCurrency.code,
        cryptoCurrency: selectedToken?.symbol ?? 'TON',
        amount: amountDebounced || '0',
        isFiatAmount: amountInputMode === 'currency',
        query: {
            enabled: !!amountDebounced && !isNaN(parseFloat(amountDebounced)) && parseFloat(amountDebounced) > 0,
            retry: false,
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

    const numericAmount = parseFloat(amount);
    const error = useMemo<string | undefined>(() => {
        if (quotesError) {
            const code = (quotesError as { code?: string }).code;
            return code === 'PAIR_NOT_SUPPORTED' ? 'pairNotSupported' : 'noQuotesFound';
        }
        if (!isNaN(numericAmount) && numericAmount > ERROR_THRESHOLD) return 'noQuotesFound';
        return undefined;
    }, [quotesError, numericAmount]);
    const canContinue =
        amount !== '' && !isNaN(numericAmount) && numericAmount > 0 && !!selectedQuote && !error && !!selectedProvider;

    const { mutateAsync: buildUrl } = useBuildOnrampUrl();
    const wallets = useConnectedWallets();
    const activeWallet = wallets?.[0];

    const onContinue = useCallback(async () => {
        if (!canContinue || !selectedQuote || !activeWallet) return;

        try {
            const url = await buildUrl({
                quote: selectedQuote,
                userAddress: activeWallet.getAddress(),
            });
            window.open(url, '_blank');
        } catch {
            // silently swallow — redirect is best-effort
        }
    }, [canContinue, selectedQuote, activeWallet, buildUrl]);

    const onReset = useCallback(() => {
        setAmount('');
        setAmountInputMode('currency');
    }, []);

    const value = useMemo(
        () => ({
            tokens,
            tokenSections,
            currencySections,
            selectedToken,
            setSelectedToken,
            currencies: ONRAMP_CURRENCIES,
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
            canContinue,
            error,
            isLoading: isQuoteLoading,
            onReset,
            onContinue,
        }),
        [
            tokens,
            tokenSections,
            currencySections,
            selectedToken,
            selectedCurrency,
            amount,
            amountInputMode,
            convertedAmount,
            providers,
            selectedProvider,
            selectedQuote,
            isReversedAmountSupported,
            canContinue,
            error,
            isQuoteLoading,
            onReset,
            onContinue,
        ],
    );

    return <OnrampContext.Provider value={value}>{children}</OnrampContext.Provider>;
};
