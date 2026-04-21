/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { FC, PropsWithChildren } from 'react';

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
import { ONRAMP_PROVIDERS as MOCK_PROVIDERS } from '../../../mock-data/providers';
import { useOnrampProviders } from '../../../hooks/use-onramp-providers';
import { useOnrampQuote } from '../../../hooks/use-onramp-quote';
import { useBuildOnrampUrl } from '../../../hooks/use-build-onramp-url';
import { useConnectedWallets } from '../../../../wallets/hooks/use-connected-wallets';

export type { AppkitUIToken };

const ERROR_THRESHOLD = 10000000;
const DEFAULT_PRESETS: OnrampAmountPreset[] = [
    { amount: '100', label: '100' },
    { amount: '250', label: '250' },
    { amount: '500', label: '500' },
    { amount: '1000', label: '1000' },
];

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
    presetAmounts: DEFAULT_PRESETS,
    providers: [],
    selectedProvider: null,
    setSelectedProvider: () => {},
    canContinue: false,
    error: undefined,
    isLoading: false,
    onReset: () => {},
    onContinue: () => {},
};

export const OnrampContext = createContext<OnrampContextType>(defaultContext);

export function useOnrampContext() {
    return useContext(OnrampContext);
}

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

    // Get real registered providers
    const registeredProviders = useOnrampProviders();

    const providers = useMemo(() => {
        if (registeredProviders.length === 0) {
            return MOCK_PROVIDERS;
        }

        return registeredProviders.map((rp) => {
            const metadata = MOCK_PROVIDERS.find((m) => m.id === rp.providerId);
            return {
                id: rp.providerId,
                name: metadata?.name ?? rp.providerId,
                description: metadata?.description ?? '',
                logo: metadata?.logo ?? '',
            };
        });
    }, [registeredProviders]);

    const [selectedProvider, setSelectedProvider] = useState<OnrampWidgetProviderType | null>(
        () => providers[0] ?? null,
    );

    // Update selected provider if it's no longer in the list or if the list was initially empty
    useEffect(() => {
        if (!selectedProvider || !providers.find((p) => p.id === selectedProvider.id)) {
            if (providers.length > 0) {
                setSelectedProvider(providers[0]!);
            }
        }
    }, [providers, selectedProvider]);

    const { data: quote, isLoading: isQuoteLoading } = useOnrampQuote({
        fiatCurrency: selectedCurrency.code,
        cryptoCurrency: selectedToken?.symbol ?? 'TON',
        amount: amount || '0',
        isFiatAmount: amountInputMode === 'currency',
        providerId: selectedProvider?.id ?? '',
        query: {
            enabled: !!amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && !!selectedProvider,
        },
    });

    const convertedAmount = useMemo(() => {
        if (!quote) return '';
        return amountInputMode === 'currency' ? quote.cryptoAmount : quote.fiatAmount;
    }, [quote, amountInputMode]);

    const numericAmount = parseFloat(amount);
    const error = !isNaN(numericAmount) && numericAmount > ERROR_THRESHOLD ? 'noQuotesFound' : undefined;
    const canContinue =
        amount !== '' && !isNaN(numericAmount) && numericAmount > 0 && !!quote && !error && !!selectedProvider;

    const { mutateAsync: buildUrl } = useBuildOnrampUrl();
    const wallets = useConnectedWallets();
    const activeWallet = wallets?.[0];

    const onContinue = async () => {
        if (!canContinue || !quote || !activeWallet || !selectedProvider) return;

        try {
            const url = await buildUrl({
                quote,
                userAddress: activeWallet.getAddress(),
                providerId: selectedProvider.id,
            });
            window.open(url, '_blank');
        } catch (_e) {
            // console.error('Failed to build onramp URL', e);
        }
    };

    const onReset = () => {
        setAmount('');
        setAmountInputMode('currency');
    };

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
            presetAmounts: DEFAULT_PRESETS,
            providers,
            selectedProvider,
            setSelectedProvider,
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
            canContinue,
            error,
            isQuoteLoading,
            onReset,
            onContinue,
        ],
    );

    return <OnrampContext.Provider value={value}>{children}</OnrampContext.Provider>;
};
