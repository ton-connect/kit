/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import type { FC, PropsWithChildren } from 'react';

import { useAddress } from '../../../../wallets';
import { useCryptoOnrampProvider } from '../../../hooks/use-crypto-onramp-provider';
import { CRYPTO_ONRAMP_TARGET_TOKENS } from '../../../mock-data/crypto-onramp-tokens';
import { CRYPTO_PAYMENT_METHODS } from '../../../mock-data/crypto-payment-methods';
import { DEFAULT_ONRAMP_PRESETS } from '../../../constants';
import type {
    CryptoOnrampToken,
    CryptoOnrampTokenSectionConfig,
    CryptoPaymentMethod,
    PaymentMethodSectionConfig,
} from '../../../types';
import { CryptoOnrampContext } from './crypto-onramp-context';
import { useCryptoOnrampBalance } from './use-crypto-onramp-balance';
import { useCryptoOnrampQuoteAndDeposit } from './use-crypto-onramp-quote-and-deposit';
import { useCryptoOnrampTokenState } from './use-crypto-onramp-token-state';
import { useCryptoOnrampValidation } from './use-crypto-onramp-validation';

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

    const quoteProvider = useCryptoOnrampProvider({ id: quote?.providerId });
    const quoteProviderName = quoteProvider?.getMetadata().name ?? null;

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
            presetAmounts: DEFAULT_ONRAMP_PRESETS,
            quote,
            isLoadingQuote,
            quoteError: validationQuoteError,
            quoteProviderName,
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
            amount,
            setAmount,
            amountInputMode,
            setAmountInputMode,
            convertedAmount,
            quote,
            isLoadingQuote,
            validationQuoteError,
            quoteProviderName,
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
