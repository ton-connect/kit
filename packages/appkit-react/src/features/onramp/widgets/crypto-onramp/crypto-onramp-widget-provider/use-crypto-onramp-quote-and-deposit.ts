/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useMemo, useState } from 'react';
import { formatUnits, parseUnits } from '@ton/appkit';
import { keepPreviousData } from '@tanstack/react-query';

import { useCreateCryptoOnrampDeposit } from '../../../hooks/use-create-crypto-onramp-deposit';
import { useCryptoOnrampQuote } from '../../../hooks/use-crypto-onramp-quote';
import { useCryptoOnrampStatus } from '../../../hooks/use-crypto-onramp-status';
import { useDebounceValue } from '../../../../../hooks/use-debounce-value';
import type { CryptoOnrampToken, CryptoPaymentMethod } from '../../../types';
import type { CryptoAmountInputMode } from './crypto-onramp-context';

const QUOTE_DEBOUNCE_MS = 500;
const STATUS_REFETCH_MS = 10000;
const LAYERSWAP_PROVIDER_ID = 'layerswap';

interface UseCryptoOnrampQuoteAndDepositOptions {
    selectedToken: CryptoOnrampToken | null;
    selectedMethod: CryptoPaymentMethod;
    amount: string;
    amountInputMode: CryptoAmountInputMode;
    userAddress: string | undefined;
}

export const useCryptoOnrampQuoteAndDeposit = ({
    selectedToken,
    selectedMethod,
    amount,
    amountInputMode,
    userAddress,
}: UseCryptoOnrampQuoteAndDepositOptions) => {
    const [refundAddress, setRefundAddress] = useState('');
    const [amountDebounced] = useDebounceValue(amount, QUOTE_DEBOUNCE_MS);

    const requestAmountDecimals =
        amountInputMode === 'method' ? selectedMethod.decimals : (selectedToken?.decimals ?? 0);

    const requestAmountBase = useMemo(() => {
        if (!amountDebounced || isNaN(parseFloat(amountDebounced))) return '';
        try {
            return parseUnits(amountDebounced, requestAmountDecimals).toString();
        } catch {
            return '';
        }
    }, [amountDebounced, requestAmountDecimals]);

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
            refetchInterval: STATUS_REFETCH_MS,
            retry: false,
        },
    });

    const convertedAmount = useMemo(() => {
        if (!quoteQuery.data) return '';
        const rawAmount = amountInputMode === 'token' ? quoteQuery.data.sourceAmount : quoteQuery.data.targetAmount;
        const decimals = amountInputMode === 'token' ? selectedMethod.decimals : (selectedToken?.decimals ?? 0);
        return formatUnits(rawAmount, decimals);
    }, [quoteQuery.data, amountInputMode, selectedMethod, selectedToken]);

    const depositAmount = useMemo(() => {
        if (createDepositMutation.data) {
            return formatUnits(createDepositMutation.data.amount, selectedMethod.decimals);
        }
        return amount;
    }, [createDepositMutation.data, amount, selectedMethod]);

    const createDeposit = useCallback(() => {
        if (!quoteQuery.data || !userAddress) return;
        const requiresRefundAddress = quoteQuery.data.providerId !== LAYERSWAP_PROVIDER_ID;
        if (requiresRefundAddress && !refundAddress) return;

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

    return {
        amountDebounced,
        quote: quoteQuery.data ?? null,
        quoteError: quoteQuery.error,
        isQuoteFetching: quoteQuery.isFetching,
        deposit: createDepositMutation.data ?? null,
        depositError: createDepositMutation.error,
        isCreatingDeposit: createDepositMutation.isPending,
        depositStatus: depositStatus ?? null,
        convertedAmount,
        depositAmount,
        refundAddress,
        setRefundAddress: handleSetRefundAddress,
        createDeposit,
        onReset,
    };
};
