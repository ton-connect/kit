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
import type { ChainInfo } from '../utils/chains';
import { DEFAULT_CHAINS } from '../utils/chains';
import type {
    CryptoOnrampToken,
    CryptoOnrampTokenSectionConfig,
    CryptoPaymentMethod,
    OnrampAmountPreset,
    PaymentMethodSectionConfig,
} from '../../../types';

/**
 * Which side the amount input is currently denominated in — `token` means the user is entering the target-token amount, `method` means they are entering the source payment-method amount.
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type CryptoAmountInputMode = 'token' | 'method';

/**
 * Shape of the `CryptoOnrampContext` value — selection state, quote/deposit data and actions exposed by {@link CryptoOnrampWidgetProvider} to the widget UI (and to custom render callbacks passed to {@link CryptoOnrampWidget}).
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export interface CryptoOnrampContextType {
    /** Full list of target tokens the user can buy. */
    tokens: CryptoOnrampToken[];
    /** Optional section configs grouping `tokens` in the picker. */
    tokenSections?: CryptoOnrampTokenSectionConfig[];
    /** Currently selected target token to buy. `null` until tokens load. */
    selectedToken: CryptoOnrampToken | null;
    /** Updates `selectedToken`. */
    setSelectedToken: (token: CryptoOnrampToken) => void;

    /** Available source crypto payment methods. */
    paymentMethods: CryptoPaymentMethod[];
    /** Optional section configs grouping `paymentMethods` in the picker. */
    methodSections?: PaymentMethodSectionConfig[];
    /** Currently selected source payment method. */
    selectedMethod: CryptoPaymentMethod;
    /** Updates `selectedMethod`. */
    setSelectedMethod: (method: CryptoPaymentMethod) => void;
    /** CAIP-2 → chain display info map (built-in defaults merged with consumer overrides). */
    chains: Record<string, ChainInfo>;

    /** Current amount input value as a decimal string. */
    amount: string;
    /** Updates `amount`. */
    setAmount: (value: string) => void;
    /** Which side `amount` is denominated in — see {@link CryptoAmountInputMode}. */
    amountInputMode: CryptoAmountInputMode;
    /** Updates `amountInputMode`. */
    setAmountInputMode: (mode: CryptoAmountInputMode) => void;
    /** Other side of `amount` after applying the current quote's rate. */
    convertedAmount: string;
    /** Quick-pick amount buttons rendered in the widget. */
    presetAmounts: OnrampAmountPreset[];

    /** Current quote, or `null` if not yet fetched / invalidated. */
    quote: CryptoOnrampQuote | null;
    /** Whether a quote is in flight (includes the input-debounce window). */
    isLoadingQuote: boolean;
    /** Quote-side validation/fetch error as an i18n key, or `null`. */
    quoteError: string | null;
    /** Display name of the provider behind the current quote, when available. */
    quoteProviderName: string | null;

    /** Current deposit returned by the provider once `createDeposit` succeeded. */
    deposit: CryptoOnrampDeposit | null;
    /** Whether `createDeposit` is in flight. */
    isCreatingDeposit: boolean;
    /** Deposit-side error as an i18n key, or `null`. */
    depositError: string | null;
    /** Formatted deposit amount the user must send on the source chain. */
    depositAmount: string;
    /** Triggers deposit creation from the current quote. */
    createDeposit: () => void;
    /** Latest deposit status polled via {@link useCryptoOnrampStatus}, or `null`. */
    depositStatus: CryptoOnrampStatus | null;

    /** Whether the current quote provider requires a refund address before deposit. */
    isRefundAddressRequired: boolean;
    /** Whether the current quote provider supports reversed (target-amount) input. */
    isReversedAmountSupported: boolean;
    /** Refund address the user typed, if `isRefundAddressRequired`. */
    refundAddress: string;
    /** Updates `refundAddress`. */
    setRefundAddress: (address: string) => void;

    /** Connected wallet's balance of the selected target token (formatted, token units). */
    targetBalance: string;
    /** Whether the target token balance is being fetched. */
    isLoadingTargetBalance: boolean;

    /** Whether a TON wallet is currently connected. */
    isWalletConnected: boolean;

    /** Whether the user can proceed — valid amount, quote available, and wallet connected. */
    canContinue: boolean;
    /** Invalidates the active quote and clears the deposit, returning the widget to its initial state. */
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
    chains: DEFAULT_CHAINS,
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

    isRefundAddressRequired: false,
    isReversedAmountSupported: true,
    refundAddress: '',
    setRefundAddress: () => {},

    targetBalance: '',
    isLoadingTargetBalance: false,

    isWalletConnected: false,

    canContinue: false,
    onReset: () => {},
};

/**
 * React context carrying the {@link CryptoOnrampContextType} value populated by {@link CryptoOnrampWidgetProvider}. Prefer reading it via {@link useCryptoOnrampContext}. Direct access is an escape hatch (e.g. `Context.Consumer`). */
export const CryptoOnrampContext = createContext<CryptoOnrampContextType>(defaultContext);

/**
 * Reads the `CryptoOnrampContext` populated by {@link CryptoOnrampWidgetProvider} — returns the widget's selection state, quote/deposit data and actions ({@link CryptoOnrampContextType}).
 *
 * @public
 * @category Hook
 * @section Crypto Onramp
 */
export const useCryptoOnrampContext = (): CryptoOnrampContextType => {
    return useContext(CryptoOnrampContext);
};
