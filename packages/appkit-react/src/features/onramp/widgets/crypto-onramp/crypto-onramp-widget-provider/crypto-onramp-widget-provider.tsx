/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createContext, useContext, useMemo, useState } from 'react';
import type { FC, PropsWithChildren } from 'react';
import type { CryptoOnrampQuote, CryptoOnrampDeposit } from '@ton/appkit';
import { formatUnits, parseUnits } from '@ton/appkit';

import type {
    CryptoOnrampToken,
    CryptoOnrampTokenSectionConfig,
    CryptoPaymentMethod,
    PaymentMethodSectionConfig,
    OnrampAmountPreset,
} from '../../../types';
import { CRYPTO_PAYMENT_METHODS } from '../../../mock-data/crypto-payment-methods';
import { CRYPTO_ONRAMP_TARGET_TOKENS } from '../../../mock-data/crypto-onramp-tokens';
import { useCryptoOnrampQuote, useCreateCryptoOnrampDeposit } from '../../../../crypto-onramp';
import { useAddress } from '../../../../wallets';
import { useDebounceValue } from '../../../../../hooks/use-debounce-value';

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
    tokens: CryptoOnrampToken[];
    /** Optional section configs for grouping tokens */
    tokenSections?: CryptoOnrampTokenSectionConfig[];
    /** Currently selected token to buy */
    selectedToken: CryptoOnrampToken | null;
    setSelectedToken: (token: CryptoOnrampToken) => void;

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
    /** Converted amount from quote */
    convertedAmount: string;
    presetAmounts: OnrampAmountPreset[];

    /** Current quote from provider */
    quote: CryptoOnrampQuote | null;
    /** Whether quote is being fetched */
    isLoadingQuote: boolean;
    /** Error from quote fetch */
    quoteError: Error | null;

    /** Current deposit offer from provider */
    deposit: CryptoOnrampDeposit | null;
    /** Whether deposit is being created */
    isCreatingDeposit: boolean;
    /** Error from deposit creation */
    depositError: Error | null;
    /** Formatted deposit amount */
    depositAmount: string;
    /** Function to trigger deposit creation */
    createDeposit: () => void;

    /** Whether a TON wallet is currently connected */
    isWalletConnected: boolean;

    canContinue: boolean;
    error?: string;
    onReset: () => void;
}

const defaultContext: CryptoOnrampContextType = {
    tokens: CRYPTO_ONRAMP_TARGET_TOKENS,
    tokenSections: undefined,
    selectedToken: CRYPTO_ONRAMP_TARGET_TOKENS[0]!,
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

    quote: null,
    isLoadingQuote: false,
    quoteError: null,

    deposit: null,
    isCreatingDeposit: false,
    depositError: null,
    depositAmount: '',
    createDeposit: () => {},

    isWalletConnected: false,

    canContinue: false,
    error: undefined,
    onReset: () => {},
};

export const CryptoOnrampContext = createContext<CryptoOnrampContextType>(defaultContext);

export function useCryptoOnrampContext(): CryptoOnrampContextType {
    return useContext(CryptoOnrampContext);
}

export interface CryptoOnrampProviderProps extends PropsWithChildren {
    tokens?: CryptoOnrampToken[];
    tokenSections?: CryptoOnrampTokenSectionConfig[];
    paymentMethods?: CryptoPaymentMethod[];
    methodSections?: PaymentMethodSectionConfig[];
    defaultTokenId?: string;
    defaultMethodId?: string;
}

export const CryptoOnrampWidgetProvider: FC<CryptoOnrampProviderProps> = ({
    children,
    tokens = CRYPTO_ONRAMP_TARGET_TOKENS,
    tokenSections,
    paymentMethods = CRYPTO_PAYMENT_METHODS,
    methodSections,
    defaultTokenId,
    defaultMethodId,
}) => {
    const [selectedToken, setSelectedToken] = useState<CryptoOnrampToken | null>(
        () => tokens.find((t) => t.id === defaultTokenId) ?? tokens[0] ?? null,
    );

    const [selectedMethod, setSelectedMethod] = useState<CryptoPaymentMethod>(
        () => paymentMethods.find((m) => m.id === defaultMethodId) ?? paymentMethods[0] ?? CRYPTO_PAYMENT_METHODS[0]!,
    );

    const [amount, setAmount] = useState('');
    const [amountInputMode, setAmountInputMode] = useState<CryptoAmountInputMode>('method');

    const userAddress = useAddress();

    const [amountDebounced] = useDebounceValue(amount, 500);

    const requestAmountNano = useMemo(() => {
        if (!amountDebounced || isNaN(parseFloat(amountDebounced))) return '';
        const decimals = amountInputMode === 'method' ? selectedMethod.decimals : (selectedToken?.decimals ?? 9);
        try {
            return parseUnits(amountDebounced, decimals).toString();
        } catch {
            return '';
        }
    }, [amountDebounced, amountInputMode, selectedMethod, selectedToken]);

    const quoteQuery = useCryptoOnrampQuote({
        amount: requestAmountNano,
        sourceCurrency: selectedMethod.address,
        sourceNetwork: selectedMethod.networkId,
        targetCurrency: selectedToken?.address ?? '',
        isSourceAmount: amountInputMode === 'method',
        providerOptions: {
            recipient: userAddress ?? '',
        },
        query: {
            enabled:
                !!requestAmountNano &&
                !!selectedToken &&
                !!userAddress &&
                !isNaN(parseFloat(amountDebounced)) &&
                parseFloat(amountDebounced) > 0,
            retry: false,
        },
    });

    const createDepositMutation = useCreateCryptoOnrampDeposit();

    const convertedAmount = useMemo(() => {
        if (quoteQuery.data) {
            const rawAmount = amountInputMode === 'token' ? quoteQuery.data.sourceAmount : quoteQuery.data.targetAmount;
            const decimals = amountInputMode === 'token' ? selectedMethod.decimals : (selectedToken?.decimals ?? 9);
            return formatUnits(rawAmount, decimals);
        }
        return '';
    }, [quoteQuery.data, amountInputMode, selectedMethod, selectedToken]);

    const numericAmount = parseFloat(amount);
    const error =
        (!isNaN(numericAmount) && numericAmount > ERROR_THRESHOLD) || quoteQuery.error ? 'noQuotesFound' : undefined;

    const canContinue =
        amount !== '' &&
        !isNaN(numericAmount) &&
        numericAmount > 0 &&
        !error &&
        !!quoteQuery.data &&
        !quoteQuery.isFetching &&
        amount === amountDebounced &&
        !!userAddress;

    const onReset = () => {
        setAmount('');
        setAmountInputMode('method');
        createDepositMutation.reset();
    };

    const depositAmount = useMemo(() => {
        if (createDepositMutation.data) {
            return formatUnits(createDepositMutation.data.amount, selectedMethod.decimals);
        }
        return amount;
    }, [createDepositMutation.data, amount, selectedMethod]);

    const createDeposit = () => {
        if (!quoteQuery.data || !userAddress) return;
        createDepositMutation.mutate({
            quote: quoteQuery.data,
            userAddress,
            providerId: quoteQuery.data.providerId,
        });
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
            quote: quoteQuery.data ?? null,
            isLoadingQuote: quoteQuery.isFetching || amount !== amountDebounced,
            quoteError: quoteQuery.error,
            deposit: createDepositMutation.data ?? null,
            isCreatingDeposit: createDepositMutation.isPending,
            depositError: createDepositMutation.error,
            depositAmount,
            createDeposit,
            isWalletConnected: !!userAddress,
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
            quoteQuery.data,
            quoteQuery.isFetching,
            quoteQuery.error,
            amountDebounced,
            createDepositMutation.data,
            createDepositMutation.isPending,
            createDepositMutation.error,
            depositAmount,
            userAddress,
            canContinue,
            error,
            onReset,
        ],
    );

    return <CryptoOnrampContext.Provider value={value}>{children}</CryptoOnrampContext.Provider>;
};
