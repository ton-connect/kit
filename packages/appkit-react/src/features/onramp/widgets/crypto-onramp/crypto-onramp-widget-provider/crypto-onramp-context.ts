/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createContext, useContext } from 'react';
import type { CryptoOnrampDeposit, CryptoOnrampQuote, CryptoOnrampStatus } from '@ton/appkit';

import { CRYPTO_ONRAMP_TARGET_TOKENS } from '../../../mock-data/crypto-onramp-tokens';
import { CRYPTO_PAYMENT_METHODS } from '../../../mock-data/crypto-payment-methods';
import { DEFAULT_ONRAMP_PRESETS } from '../../../constants';
import type {
    CryptoOnrampToken,
    CryptoOnrampTokenSectionConfig,
    CryptoPaymentMethod,
    OnrampAmountPreset,
    PaymentMethodSectionConfig,
} from '../../../types';

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
    /** Error from quote fetch (i18n key) */
    quoteError: string | null;
    /** Display name of the provider behind the current quote, when one is available. */
    quoteProviderName: string | null;

    /** Current deposit offer from provider */
    deposit: CryptoOnrampDeposit | null;
    /** Whether deposit is being created */
    isCreatingDeposit: boolean;
    /** Error from deposit creation (i18n key) */
    depositError: string | null;
    /** Formatted deposit amount */
    depositAmount: string;
    /** Function to trigger deposit creation */
    createDeposit: () => void;
    /** Deposit status */
    depositStatus: CryptoOnrampStatus | null;

    /** Whether the current quote provider requires a refund address */
    requiresRefundAddress: boolean;
    /** Refund address */
    refundAddress: string;
    setRefundAddress: (address: string) => void;

    /** User's balance of the selected target token (formatted, token units) */
    targetBalance: string;
    /** Whether the target token balance is being fetched */
    isLoadingTargetBalance: boolean;

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
    presetAmounts: DEFAULT_ONRAMP_PRESETS,

    quote: null,
    isLoadingQuote: false,
    quoteError: null,
    quoteProviderName: null,

    deposit: null,
    isCreatingDeposit: false,
    depositError: null,
    depositAmount: '',
    createDeposit: () => {},
    depositStatus: null,

    requiresRefundAddress: false,
    refundAddress: '',
    setRefundAddress: () => {},

    targetBalance: '',
    isLoadingTargetBalance: false,

    isWalletConnected: false,

    canContinue: false,
    onReset: () => {},
};

export const CryptoOnrampContext = createContext<CryptoOnrampContextType>(defaultContext);

export const useCryptoOnrampContext = (): CryptoOnrampContextType => {
    return useContext(CryptoOnrampContext);
};
