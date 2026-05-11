/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useMemo } from 'react';
import type { FC, PropsWithChildren } from 'react';

import { useAddress } from '../../../../wallets';
import { CRYPTO_ONRAMP_TARGET_TOKENS } from '../../../mock-data/crypto-onramp-tokens';
import { CRYPTO_PAYMENT_METHODS } from '../../../mock-data/crypto-payment-methods';
import { DEFAULT_ONRAMP_PRESETS } from '../../../constants';
import type {
    CryptoOnrampToken,
    CryptoOnrampTokenSectionConfig,
    CryptoPaymentMethod,
    PaymentMethodSectionConfig,
} from '../../../types';
import type { ChainInfo } from '../utils/chains';
import { DEFAULT_CHAINS } from '../utils/chains';
import { CryptoOnrampContext } from './crypto-onramp-context';
import { useCryptoOnrampBalance } from './use-crypto-onramp-balance';
import { useCryptoOnrampQuoteAndDeposit } from './use-crypto-onramp-quote-and-deposit';
import { useCryptoOnrampTokenState } from './use-crypto-onramp-token-state';
import { useCryptoOnrampValidation } from './use-crypto-onramp-validation';

/**
 * Props for {@link CryptoOnrampWidgetProvider} — configures the target tokens and payment methods exposed to the widget, plus optional chain display overrides.
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export interface CryptoOnrampProviderProps extends PropsWithChildren {
    /** Target tokens (what the user buys on TON). Defaults to a built-in list. */
    tokens?: CryptoOnrampToken[];
    /** Optional section configs grouping `tokens` in the picker. */
    tokenSections?: CryptoOnrampTokenSectionConfig[];
    /** Source crypto payment methods (what the user pays with on another chain). Defaults to a built-in list. */
    paymentMethods?: CryptoPaymentMethod[];
    /** Optional section configs grouping `paymentMethods` in the picker. */
    methodSections?: PaymentMethodSectionConfig[];
    /**
     * Custom CAIP-2 → chain display info overrides. Merged on top of the
     * built-in defaults, so consumers only need to provide what they want to
     * override or add (e.g. `{ 'eip155:42161': { name: 'Arbitrum', logo: '...' } }`).
     */
    chains?: Record<string, ChainInfo>;
    /** Id of the target token pre-selected on mount. */
    defaultTokenId?: string;
    /** Id of the source payment method pre-selected on mount. */
    defaultMethodId?: string;
}

/**
 * Context provider that powers the crypto-to-TON onramp widget — wires together token/method selection state, quote fetching ({@link useCryptoOnrampQuote}), deposit creation ({@link useCreateCryptoOnrampDeposit}), deposit status polling ({@link useCryptoOnrampStatus}), the target-token balance and validation. Consumers read the state via {@link useCryptoOnrampContext}.
 *
 * @public
 * @category Component
 * @section Crypto Onramp
 */
export const CryptoOnrampWidgetProvider: FC<CryptoOnrampProviderProps> = ({
    children,
    tokens = CRYPTO_ONRAMP_TARGET_TOKENS,
    tokenSections,
    paymentMethods = CRYPTO_PAYMENT_METHODS,
    methodSections,
    chains: chainsOverride,
    defaultTokenId,
    defaultMethodId,
}) => {
    // 1. Local state
    const {
        selectedToken,
        setSelectedToken,
        selectedMethod,
        setSelectedMethod,
        amount,
        setAmount,
        amountInputMode,
        setAmountInputMode,
    } = useCryptoOnrampTokenState({ tokens, paymentMethods, defaultTokenId, defaultMethodId });

    // 2. Queries and external readers
    const userAddress = useAddress();
    const { targetBalance, isLoadingTargetBalance } = useCryptoOnrampBalance({ selectedToken, userAddress });

    // 4. Mutations (quote query + deposit mutation + status query coordinated together)
    const {
        amountDebounced,
        quote,
        quoteError,
        isQuoteFetching,
        quoteProviderName,
        isRefundAddressRequired,
        isReversedAmountSupported,
        deposit,
        depositError,
        isCreatingDeposit,
        depositStatus,
        convertedAmount,
        depositAmount,
        refundAddress,
        setRefundAddress,
        createDeposit,
        onReset,
    } = useCryptoOnrampQuoteAndDeposit({
        selectedToken,
        selectedMethod,
        amount,
        amountInputMode,
        userAddress,
    });

    // 3. Derivations
    const {
        quoteError: validationQuoteError,
        depositError: validationDepositError,
        canSubmit,
    } = useCryptoOnrampValidation({
        amount,
        amountDebounced,
        amountInputMode,
        selectedMethod,
        selectedToken,
        quoteError,
        depositError,
        hasQuote: !!quote,
    });

    const isLoadingQuote = isQuoteFetching || amount !== amountDebounced;
    const canContinue = canSubmit && !isQuoteFetching && amount === amountDebounced && !!userAddress;

    const chains = useMemo(() => ({ ...DEFAULT_CHAINS, ...(chainsOverride ?? {}) }), [chainsOverride]);

    useEffect(() => {
        if (!isReversedAmountSupported && amountInputMode === 'token') {
            setAmountInputMode('method');
        }
    }, [isReversedAmountSupported, amountInputMode, setAmountInputMode]);

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
            chains,
            amount,
            setAmount,
            amountInputMode,
            setAmountInputMode,
            convertedAmount,
            presetAmounts: DEFAULT_ONRAMP_PRESETS,
            quote,
            isLoadingQuote,
            quoteError: validationQuoteError,
            quoteProviderName,
            isRefundAddressRequired,
            isReversedAmountSupported,
            deposit,
            isCreatingDeposit,
            depositError: validationDepositError,
            depositAmount,
            createDeposit,
            isWalletConnected: !!userAddress,
            canContinue,
            onReset,
            depositStatus,
            refundAddress,
            setRefundAddress,
            targetBalance,
            isLoadingTargetBalance,
        }),
        [
            tokens,
            tokenSections,
            selectedToken,
            setSelectedToken,
            paymentMethods,
            methodSections,
            selectedMethod,
            setSelectedMethod,
            chains,
            amount,
            setAmount,
            amountInputMode,
            setAmountInputMode,
            convertedAmount,
            quote,
            isLoadingQuote,
            validationQuoteError,
            quoteProviderName,
            isRefundAddressRequired,
            isReversedAmountSupported,
            deposit,
            isCreatingDeposit,
            validationDepositError,
            depositAmount,
            createDeposit,
            userAddress,
            canContinue,
            onReset,
            depositStatus,
            refundAddress,
            setRefundAddress,
            targetBalance,
            isLoadingTargetBalance,
        ],
    );

    return <CryptoOnrampContext.Provider value={value}>{children}</CryptoOnrampContext.Provider>;
};
