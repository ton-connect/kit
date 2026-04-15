/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { FC, PropsWithChildren } from 'react';
import type { Network, StakingQuoteDirection } from '@ton/appkit';
import { parseUnits, validateNumericString } from '@ton/appkit';
import type { StakingQuote, StakingProviderInfo, StakingBalance, UnstakeModes } from '@ton/appkit';
import { UnstakeMode } from '@ton/appkit';

import { useStakingQuote } from '../../hooks/use-staking-quote';
import { useStakingProviderInfo } from '../../hooks/use-staking-provider-info';
import { useStakedBalance } from '../../hooks/use-staked-balance';
import { useBuildStakeTransaction } from '../../hooks/use-build-stake-transaction';
import { useSelectedWallet, useAddress } from '../../../wallets';
import { useBalance } from '../../../balances/hooks/use-balance';
import { useSendTransaction } from '../../../transaction/hooks/use-send-transaction';
import { useDebounceValue } from '../../../../hooks/use-debounce-value';
import { useStakingValidation } from './use-staking-validation';
import { calculateToLst } from '../../utils/calculate-lst';

export type StakingWidgetError = 'insufficientBalance' | 'tooManyDecimals' | 'quoteError' | null;

export interface StakingContextType {
    /** Amount the user wants to stake (string to preserve input UX) */
    amount: string;
    /** Fiat currency symbol, e.g. "$" */
    fiatSymbol: string;
    /** TON exchange rate for fiat display */
    tonRate: string | undefined;
    /** Whether the user can proceed with staking */
    canSubmit: boolean;
    /** Whether a wallet is connected */
    isWalletConnected: boolean;
    /** Raw staking quote from the provider */
    quote: StakingQuote | undefined;
    /** True while the stake quote is being fetched */
    isQuoteLoading: boolean;
    /** Current validation/fetch error for staking, null when everything is ok */
    error: StakingWidgetError;
    /** Staking provider info (APY, instant unstake availability, etc.) */
    providerInfo: StakingProviderInfo | undefined;
    /** Current direction */
    direction: StakingQuoteDirection;
    /** True while provider info is being fetched */
    isProviderInfoLoading: boolean;
    /** User's staked balance */
    stakedBalance: StakingBalance | undefined;
    /** True while staked balance is being fetched */
    isStakedBalanceLoading: boolean;
    /** Selected unstake mode */
    unstakeMode: UnstakeModes;
    setAmount: (amount: string) => void;
    setUnstakeMode: (mode: UnstakeModes) => void;
    sendStakingTransaction: () => Promise<void>;
    sendUnstakingTransaction: () => Promise<void>;
    onChangeDirection: (direction: StakingQuoteDirection) => void;
    isSendingTransaction: boolean;
}

export const StakingContext = createContext<StakingContextType>({
    amount: '',
    fiatSymbol: '$',
    tonRate: undefined,
    canSubmit: false,
    isWalletConnected: false,
    quote: undefined,
    isQuoteLoading: false,
    error: null,
    providerInfo: undefined,
    direction: 'stake',
    isProviderInfoLoading: false,
    stakedBalance: undefined,
    isStakedBalanceLoading: false,
    unstakeMode: UnstakeMode.INSTANT,
    setAmount: () => {},
    setUnstakeMode: () => {},
    sendStakingTransaction: () => Promise.resolve(),
    sendUnstakingTransaction: () => Promise.resolve(),
    onChangeDirection: () => {},
    isSendingTransaction: false,
});

export const useStakingContext = () => {
    return useContext(StakingContext);
};

export interface StakingProviderProps extends PropsWithChildren {
    /** Network to use for quote fetching */
    network: Network;
    /** Fiat currency symbol shown next to amounts, defaults to "$" */
    fiatSymbol?: string;
    /** TON exchange rate for fiat display (e.g. "3.42") */
    tonRate?: string;
}

export const StakingWidgetProvider: FC<StakingProviderProps> = ({ children, network, fiatSymbol = '$', tonRate }) => {
    const [amount, setAmountRaw] = useState('');
    const [unstakeMode, setUnstakeMode] = useState<UnstakeModes>(UnstakeMode.INSTANT);
    const [direction, setDirection] = useState<StakingQuoteDirection>('stake');

    const [wallet] = useSelectedWallet();
    const isWalletConnected = wallet !== null;
    const address = useAddress();

    const { data: balance } = useBalance();
    const { data: stakedBalanceData, isFetching: isStakedBalanceLoading } = useStakedBalance({
        userAddress: address ?? undefined,
        network,
        query: { refetchInterval: 5000 },
    });
    const { data: providerInfo, isFetching: isProviderInfoLoading } = useStakingProviderInfo({ network });

    const { mutateAsync: buildTransaction } = useBuildStakeTransaction();
    const { mutateAsync: sendTransaction, isPending: isSendingTransaction } = useSendTransaction();

    const setAmount = useCallback((value: string) => {
        if (value === '' || validateNumericString(value, 9)) setAmountRaw(value);
    }, []);

    const quoteAmount = useMemo(() => {
        if (direction !== 'unstake') return amount;
        if (!providerInfo) return '';

        const result = calculateToLst(amount, providerInfo.lstExchangeRate, providerInfo.lstDecimals);

        if (
            stakedBalanceData &&
            BigInt(stakedBalanceData.rawStakedBalance) - parseUnits(result, providerInfo.lstDecimals) <= 2n
        ) {
            return stakedBalanceData.stakedBalance;
        }

        return result;
    }, [direction, providerInfo?.lstExchangeRate, providerInfo?.lstDecimals, amount]);

    const [amountDebounced] = useDebounceValue(quoteAmount, 500);

    const {
        data: quote,
        isFetching: isQuoteLoading,
        error: quoteError,
    } = useStakingQuote({
        direction,
        amount: amountDebounced,
        unstakeMode,
        network,
    });

    const sendStakingTransaction = useCallback(async () => {
        if (!quote || !address) return;

        const transactionParams = await buildTransaction({ quote, userAddress: address });

        await sendTransaction(transactionParams);
    }, [quote, address, buildTransaction, sendTransaction]);

    const sendUnstakingTransaction = useCallback(async () => {
        if (!quote || !address) return;

        const transactionParams = await buildTransaction({ quote, userAddress: address });

        await sendTransaction(transactionParams);
    }, [quote, address, buildTransaction, sendTransaction]);

    const { error, canSubmit } = useStakingValidation({
        amount: quoteAmount,
        amountDebounced,
        balance,
        quoteError,
        direction,
        stakedBalance: stakedBalanceData?.stakedBalance,
    });

    const value = useMemo(
        () => ({
            amount,
            fiatSymbol,
            tonRate,
            canSubmit,
            direction,
            isWalletConnected,
            quote,
            isQuoteLoading: isQuoteLoading || isProviderInfoLoading || quoteAmount !== amountDebounced,
            error,
            providerInfo,
            isProviderInfoLoading,
            stakedBalance: stakedBalanceData,
            isStakedBalanceLoading,
            unstakeMode,
            setAmount,
            setUnstakeMode,
            sendStakingTransaction,
            sendUnstakingTransaction,
            isSendingTransaction,
            onChangeDirection: setDirection,
        }),
        [
            amount,
            quoteAmount,
            amountDebounced,
            fiatSymbol,
            tonRate,
            canSubmit,
            isWalletConnected,
            direction,
            quote,
            isQuoteLoading,
            error,
            providerInfo,
            isProviderInfoLoading,
            stakedBalanceData,
            isStakedBalanceLoading,
            unstakeMode,
            setAmount,
            setUnstakeMode,
            sendStakingTransaction,
            sendUnstakingTransaction,
            isSendingTransaction,
            setDirection,
        ],
    );

    return <StakingContext.Provider value={value}>{children}</StakingContext.Provider>;
};
