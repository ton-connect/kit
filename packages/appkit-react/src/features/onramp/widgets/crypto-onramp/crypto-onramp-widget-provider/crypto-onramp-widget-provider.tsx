/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createContext, useContext, useMemo, useState } from 'react';
import type { FC, PropsWithChildren } from 'react';

import type { AppkitUIToken } from '../../../../../types/appkit-ui-token';
import type { TokenSectionConfig } from '../../../../../components/token-select-modal';
import type { CryptoPaymentMethod, PaymentMethodSectionConfig, OnrampAmountPreset } from '../../../types';
import { CRYPTO_PAYMENT_METHODS } from '../../../mock-data/crypto-payment-methods';

const MOCK_RATE = 71234;
const ERROR_THRESHOLD = 10000;
const DEFAULT_PRESETS: OnrampAmountPreset[] = [
    { amount: '100', label: '100' },
    { amount: '250', label: '250' },
    { amount: '500', label: '500' },
    { amount: '1000', label: '1000' },
];

export type CryptoAmountInputMode = 'token' | 'method';

export interface CryptoOnrampContextType {
    /** Full list of tokens to buy */
    tokens: AppkitUIToken[];
    /** Optional section configs for grouping tokens */
    tokenSections?: TokenSectionConfig[];
    /** Currently selected token to buy */
    selectedToken: AppkitUIToken | null;
    setSelectedToken: (token: AppkitUIToken) => void;

    /** Available crypto payment methods */
    paymentMethods: CryptoPaymentMethod[];
    /** Optional section configs for grouping payment methods */
    methodSections?: PaymentMethodSectionConfig[];
    /** Currently selected payment method */
    selectedMethod: CryptoPaymentMethod;
    setSelectedMethod: (method: CryptoPaymentMethod) => void;

    /** Current amount input value */
    amount: string;
    setAmount: (value: string) => void;
    /** Whether user is entering token amount or payment-method amount */
    amountInputMode: CryptoAmountInputMode;
    setAmountInputMode: (mode: CryptoAmountInputMode) => void;
    /** Mocked converted amount */
    convertedAmount: string;
    presetAmounts: OnrampAmountPreset[];

    canContinue: boolean;
    error?: string;
    onReset: () => void;
}

const defaultContext: CryptoOnrampContextType = {
    tokens: [],
    tokenSections: undefined,
    selectedToken: null,
    setSelectedToken: () => {},
    paymentMethods: CRYPTO_PAYMENT_METHODS,
    methodSections: undefined,
    selectedMethod: CRYPTO_PAYMENT_METHODS[0]!,
    setSelectedMethod: () => {},
    amount: '',
    setAmount: () => {},
    amountInputMode: 'method',
    setAmountInputMode: () => {},
    convertedAmount: '',
    presetAmounts: DEFAULT_PRESETS,
    canContinue: false,
    error: undefined,
    onReset: () => {},
};

export const CryptoOnrampContext = createContext<CryptoOnrampContextType>(defaultContext);

export function useCryptoOnrampContext(): CryptoOnrampContextType {
    return useContext(CryptoOnrampContext);
}

export interface CryptoOnrampProviderProps extends PropsWithChildren {
    tokens: AppkitUIToken[];
    tokenSections?: TokenSectionConfig[];
    paymentMethods?: CryptoPaymentMethod[];
    methodSections?: PaymentMethodSectionConfig[];
    defaultTokenId?: string;
    defaultMethodId?: string;
}

export const CryptoOnrampWidgetProvider: FC<CryptoOnrampProviderProps> = ({
    children,
    tokens,
    tokenSections,
    paymentMethods = CRYPTO_PAYMENT_METHODS,
    methodSections,
    defaultTokenId,
    defaultMethodId,
}) => {
    const [selectedToken, setSelectedToken] = useState<AppkitUIToken | null>(
        () => tokens.find((t) => t.id === defaultTokenId) ?? tokens[0] ?? null,
    );

    const [selectedMethod, setSelectedMethod] = useState<CryptoPaymentMethod>(
        () => paymentMethods.find((m) => m.id === defaultMethodId) ?? paymentMethods[0] ?? CRYPTO_PAYMENT_METHODS[0]!,
    );

    const [amount, setAmount] = useState('');
    const [amountInputMode, setAmountInputMode] = useState<CryptoAmountInputMode>('method');

    const convertedAmount = useMemo(() => {
        const num = parseFloat(amount);
        if (!amount || isNaN(num)) return '';
        if (amountInputMode === 'token') {
            return (num / MOCK_RATE).toFixed(8);
        }
        return (num * MOCK_RATE).toFixed(2);
    }, [amount, amountInputMode]);

    const numericAmount = parseFloat(amount);
    const error = !isNaN(numericAmount) && numericAmount > ERROR_THRESHOLD ? 'noQuotesFound' : undefined;
    const canContinue = amount !== '' && !isNaN(numericAmount) && numericAmount > 0 && !error;

    const onReset = () => {
        setAmount('');
        setAmountInputMode('method');
    };

    const value = useMemo(
        () => ({
            tokens,
            tokenSections,
            selectedToken,
            setSelectedToken,
            paymentMethods,
            methodSections,
            selectedMethod,
            setSelectedMethod,
            amount,
            setAmount,
            amountInputMode,
            setAmountInputMode,
            convertedAmount,
            presetAmounts: DEFAULT_PRESETS,
            canContinue,
            error,
            onReset,
        }),
        [
            tokens,
            tokenSections,
            selectedToken,
            paymentMethods,
            methodSections,
            selectedMethod,
            amount,
            amountInputMode,
            convertedAmount,
            canContinue,
            error,
            onReset,
        ],
    );

    return <CryptoOnrampContext.Provider value={value}>{children}</CryptoOnrampContext.Provider>;
};
