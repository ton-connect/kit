/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { FC, PropsWithChildren } from 'react';

import type { AppkitUIToken } from '../../../../types/appkit-ui-token';
import type { OnrampCurrency, OnrampProvider, AmountInputMode, OnrampAmountPreset } from '../../types';
import { ONRAMP_CURRENCIES } from '../../mock-data/currencies';
import { ONRAMP_PROVIDERS } from '../../mock-data/providers';

export type { AppkitUIToken };

const MOCK_RATE = 0.82;
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
    providers: OnrampProvider[];

    /** Whether amount is valid and user can proceed */
    canContinue: boolean;
    /** Current error, e.g. 'noQuotesFound' */
    error?: string;
    /** Reset widget to initial state */
    onReset: () => void;
}

const defaultContext: OnrampContextType = {
    tokens: [],
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
    canContinue: false,
    error: undefined,
    onReset: () => {},
};

export const OnrampContext = createContext<OnrampContextType>(defaultContext);

export function useOnrampContext() {
    return useContext(OnrampContext);
}

export interface OnrampProviderProps extends PropsWithChildren {
    /** Full list of tokens available for purchase */
    tokens: AppkitUIToken[];
    /** Symbol of the token pre-selected for purchase */
    defaultTokenSymbol?: string;
    /** Code of the fiat currency pre-selected */
    defaultCurrencyCode?: string;
}

export const OnrampWidgetProvider: FC<OnrampProviderProps> = ({
    children,
    tokens,
    defaultTokenSymbol,
    defaultCurrencyCode,
}) => {
    const [selectedToken, setSelectedToken] = useState<AppkitUIToken | null>(
        () => tokens.find((t) => t.symbol === defaultTokenSymbol) ?? tokens[0] ?? null,
    );

    const [selectedCurrency, setSelectedCurrency] = useState<OnrampCurrency>(
        () => ONRAMP_CURRENCIES.find((c) => c.code === defaultCurrencyCode) ?? ONRAMP_CURRENCIES[0]!,
    );

    const [amount, setAmount] = useState('');
    const [amountInputMode, setAmountInputMode] = useState<AmountInputMode>('currency');
    const [selectedProvider, setSelectedProvider] = useState<OnrampProvider | null>(null);
    const [isPurchasing, setIsPurchasing] = useState(false);

    const convertedAmount = useMemo(() => {
        const num = parseFloat(amount);
        if (!amount || isNaN(num)) return '';
        if (amountInputMode === 'token') {
            return (num * MOCK_RATE).toFixed(2);
        }
        return (num / MOCK_RATE).toFixed(2);
    }, [amount, amountInputMode]);

    const numericAmount = parseFloat(amount);
    const error = !isNaN(numericAmount) && numericAmount > ERROR_THRESHOLD ? 'noQuotesFound' : undefined;
    const canContinue = amount !== '' && !isNaN(numericAmount) && numericAmount > 0 && !error;

    const onPurchase = useCallback(() => {
        setIsPurchasing(true);
        setTimeout(() => {
            setIsPurchasing(false);
        }, 1500);
    }, []);

    const onReset = useCallback(() => {
        setAmount('');
        setSelectedProvider(null);
        setAmountInputMode('token');
        setIsPurchasing(false);
    }, []);

    const value = useMemo(
        () => ({
            tokens,
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
            providers: ONRAMP_PROVIDERS,
            selectedProvider,
            setSelectedProvider,
            canContinue,
            error,
            isPurchasing,
            onPurchase,
            onReset,
        }),
        [
            tokens,
            selectedToken,
            selectedCurrency,
            amount,
            amountInputMode,
            convertedAmount,
            selectedProvider,
            canContinue,
            error,
            isPurchasing,
            onPurchase,
            onReset,
        ],
    );

    return <OnrampContext.Provider value={value}>{children}</OnrampContext.Provider>;
};
