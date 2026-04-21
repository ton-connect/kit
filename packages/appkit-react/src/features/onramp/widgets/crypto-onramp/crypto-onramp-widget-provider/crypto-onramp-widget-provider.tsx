/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { FC, PropsWithChildren } from 'react';
import type { CryptoOnrampQuote, CryptoOnrampDeposit, CryptoOnrampStatus } from '@ton/appkit';
import { formatUnits, parseUnits, validateNumericString } from '@ton/appkit';
import { keepPreviousData } from '@tanstack/react-query';

import type {
    CryptoOnrampToken,
    CryptoOnrampTokenSectionConfig,
    CryptoPaymentMethod,
    PaymentMethodSectionConfig,
    OnrampAmountPreset,
} from '../../../types';
import { CRYPTO_PAYMENT_METHODS } from '../../../mock-data/crypto-payment-methods';
import { CRYPTO_ONRAMP_TARGET_TOKENS } from '../../../mock-data/crypto-onramp-tokens';
import { useCryptoOnrampQuote, useCreateCryptoOnrampDeposit, useCryptoOnrampStatus } from '../../../../crypto-onramp';
import { useAddress } from '../../../../wallets';
import { useDebounceValue } from '../../../../../hooks/use-debounce-value';
import { useCryptoOnrampValidation } from './use-crypto-onramp-validation';

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
    quoteError: string | null;

    /** Current deposit offer from provider */
    deposit: CryptoOnrampDeposit | null;
    /** Whether deposit is being created */
    isCreatingDeposit: boolean;
    /** Error from deposit creation */
    depositError: string | null;
    /** Formatted deposit amount */
    depositAmount: string;
    /** Function to trigger deposit creation */
    createDeposit: () => void;
    /** Deposit status */
    depositStatus: CryptoOnrampStatus | null;

    /** Refund address */
    refundAddress: string;
    setRefundAddress: (address: string) => void;

    /** Whether a TON wallet is currently connected */
    isWalletConnected: boolean;

    /** Whether the user can proceed (valid amount + quote available + wallet connected) */
    canContinue: boolean;
    /** Reset state (invalidate quote and clear deposit) */
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
    depositStatus: null,

    refundAddress: '',
    setRefundAddress: () => {},

    isWalletConnected: false,

    canContinue: false,
    onReset: () => {},
};

export const CryptoOnrampContext = createContext<CryptoOnrampContextType>(defaultContext);

export const useCryptoOnrampContext = (): CryptoOnrampContextType => {
    return useContext(CryptoOnrampContext);
};

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

    const [refundAddress, setRefundAddress] = useState('');

    const [amount, setAmountRaw] = useState('');
    const [amountInputMode, setAmountInputMode] = useState<CryptoAmountInputMode>('method');

    const amountDecimals = amountInputMode === 'method' ? selectedMethod.decimals : (selectedToken?.decimals ?? 9);

    const setAmount = useCallback(
        (value: string) => {
            if (value === '' || validateNumericString(value, amountDecimals)) setAmountRaw(value);
        },
        [amountDecimals],
    );

    const userAddress = useAddress();

    const [amountDebounced] = useDebounceValue(amount, 500);

    const requestAmountBase = useMemo(() => {
        if (!amountDebounced || isNaN(parseFloat(amountDebounced))) return '';
        try {
            return parseUnits(amountDebounced, amountDecimals).toString();
        } catch {
            return '';
        }
    }, [amountDebounced, amountDecimals]);

    const quoteQuery = useCryptoOnrampQuote({
        amount: requestAmountBase,
        sourceCurrencyAddress: selectedMethod.address,
        sourceNetwork: selectedMethod.networkId,
        targetCurrencyAddress: selectedToken?.address ?? '',
        isSourceAmount: amountInputMode === 'method',
        providerOptions: {
            recipient: userAddress ?? '',
        },
        query: {
            enabled: !!requestAmountBase && !!selectedToken && !!userAddress && parseFloat(amountDebounced) > 0,
            retry: false,
            placeholderData: keepPreviousData,
            refetchOnWindowFocus: false,
        },
    });

    const createDepositMutation = useCreateCryptoOnrampDeposit();

    const { data: depositStatus } = useCryptoOnrampStatus({
        depositId: createDepositMutation.data?.depositId,
        query: {
            refetchInterval: 10000,
            retry: false,
        },
    });

    const convertedAmount = useMemo(() => {
        if (!quoteQuery.data) return '';
        const rawAmount = amountInputMode === 'token' ? quoteQuery.data.sourceAmount : quoteQuery.data.targetAmount;
        const decimals = amountInputMode === 'token' ? selectedMethod.decimals : (selectedToken?.decimals ?? 9);
        return formatUnits(rawAmount, decimals);
    }, [quoteQuery.data, amountInputMode, selectedMethod, selectedToken]);

    const { quoteError, depositError, canSubmit } = useCryptoOnrampValidation({
        amount,
        amountDebounced,
        amountInputMode,
        selectedMethod,
        selectedToken,
        quoteError: quoteQuery.error,
        depositError: createDepositMutation.error,
        hasQuote: !!quoteQuery.data,
    });

    const canContinue = canSubmit && !quoteQuery.isFetching && amount === amountDebounced && !!userAddress;

    const depositAmount = useMemo(() => {
        if (createDepositMutation.data) {
            return formatUnits(createDepositMutation.data.amount, selectedMethod.decimals);
        }
        return amount;
    }, [createDepositMutation.data, amount, selectedMethod]);

    const createDeposit = useCallback(() => {
        if (!quoteQuery.data || !userAddress || !refundAddress) return;

        createDepositMutation.mutate({
            quote: quoteQuery.data,
            userAddress,
            providerId: quoteQuery.data.providerId,
            refundAddress,
        });
    }, [quoteQuery.data, userAddress, createDepositMutation, refundAddress]);

    const onReset = useCallback(() => {
        createDepositMutation.reset();
        quoteQuery.refetch();
        setRefundAddress('');
    }, [createDepositMutation, quoteQuery]);

    const handleSetRefundAddress = useCallback(
        (address: string) => {
            setRefundAddress(address);
            if (createDepositMutation.isError) {
                createDepositMutation.reset();
            }
        },
        [createDepositMutation],
    );

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
            quoteError,
            deposit: createDepositMutation.data ?? null,
            isCreatingDeposit: createDepositMutation.isPending,
            depositError,
            depositAmount,
            createDeposit,
            isWalletConnected: !!userAddress,
            canContinue,
            onReset,
            depositStatus: depositStatus ?? null,
            refundAddress,
            setRefundAddress: handleSetRefundAddress,
        }),
        [
            tokens,
            tokenSections,
            selectedToken,
            paymentMethods,
            methodSections,
            selectedMethod,
            amount,
            setAmount,
            amountInputMode,
            convertedAmount,
            quoteQuery.data,
            quoteQuery.isFetching,
            quoteError,
            amountDebounced,
            createDepositMutation.data,
            createDepositMutation.isPending,
            depositError,
            depositAmount,
            createDeposit,
            userAddress,
            canContinue,
            onReset,
            depositStatus,
            refundAddress,
            handleSetRefundAddress,
        ],
    );

    return <CryptoOnrampContext.Provider value={value}>{children}</CryptoOnrampContext.Provider>;
};
