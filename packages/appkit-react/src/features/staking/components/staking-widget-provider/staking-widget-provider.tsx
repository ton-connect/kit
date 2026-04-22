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
import { validateNumericString } from '@ton/appkit';
import type {
    StakingQuote,
    StakingProviderInfo,
    StakingBalance,
    UnstakeModes,
    StakingProviderMetadata,
} from '@ton/appkit';
import { UnstakeMode } from '@ton/appkit';
import { keepPreviousData } from '@tanstack/react-query';

import { useNetwork } from '../../../network';
import { convertByRate } from '../../utils/convert-by-rate';
import { useStakingQuote } from '../../hooks/use-staking-quote';
import type { UseStakingQuoteParameters } from '../../hooks/use-staking-quote';
import { useStakingProviderInfo } from '../../hooks/use-staking-provider-info';
import { useStakingProviderMetadata } from '../../hooks/use-staking-provider-metadata';
import { useStakedBalance } from '../../hooks/use-staked-balance';
import { useBuildStakeTransaction } from '../../hooks/use-build-stake-transaction';
import { useAddress } from '../../../wallets';
import { useBalance } from '../../../balances/hooks/use-balance';
import { useJettonBalanceByAddress } from '../../../jettons/hooks/use-jetton-balance-by-address';
import { useSendTransaction } from '../../../transaction/hooks/use-send-transaction';
import { useDebounceValue } from '../../../../hooks/use-debounce-value';
import { useStakingValidation } from './use-staking-validation';

export type StakingWidgetError = 'insufficientBalance' | 'tooManyDecimals' | 'quoteError' | null;

/**
 * Context type for the StakingWidget.
 * Provides all necessary state and actions for building custom staking UIs.
 */
export interface StakingContextType {
    /** Amount the user wants to stake (string to preserve input UX) */
    amount: string;
    /** Whether the user can proceed with staking (checks balance, amount validity, etc.) */
    canSubmit: boolean;
    /** Raw staking quote from the provider */
    quote: StakingQuote | undefined;
    /** True while the stake quote is being fetched */
    isQuoteLoading: boolean;
    /** Current validation/fetch error for staking, null when everything is ok */
    error: StakingWidgetError;
    /** Staking provider dynamic info (APY, instant unstake availability, etc.) */
    providerInfo: StakingProviderInfo | undefined;
    /** Staking provider static metadata */
    providerMetadata: StakingProviderMetadata | undefined;
    /** Current operation direction: 'stake' or 'unstake' */
    direction: StakingQuoteDirection;
    /** True while provider info is being fetched */
    isProviderInfoLoading: boolean;
    /** Base balance (native or jetton) available for staking */
    balance: string | undefined;
    /** True while base balance is being fetched */
    isBalanceLoading: boolean;
    /** User's currently staked balance */
    stakedBalance: StakingBalance | undefined;
    /** True while staked balance is being fetched */
    isStakedBalanceLoading: boolean;
    /** Selected unstake mode (e.g. instant or delayed) */
    unstakeMode: UnstakeModes;
    /** Sets the input amount */
    setAmount: (amount: string) => void;
    /** Sets the unstake mode */
    setUnstakeMode: (mode: UnstakeModes) => void;
    /** Triggers the staking/unstaking transaction */
    sendTransaction: () => Promise<void>;
    /** Changes the direction (stake/unstake) */
    onChangeDirection: (direction: StakingQuoteDirection) => void;
    /** True while a transaction is being processed */
    isSendingTransaction: boolean;
    /** True if the user is inputting the output amount ("I want to get X") */
    isReversed: boolean;
    /** Toggles between inputting from amount and output amount */
    toggleReversed: () => void;
    /** Amount displayed in the reversed (bottom) input */
    reversedAmount: string;
}

export const StakingContext = createContext<StakingContextType>({
    amount: '',
    canSubmit: false,
    quote: undefined,
    isQuoteLoading: false,
    error: null,
    providerInfo: undefined,
    providerMetadata: undefined,
    direction: 'stake',
    isProviderInfoLoading: false,
    balance: undefined,
    isBalanceLoading: false,
    stakedBalance: undefined,
    isStakedBalanceLoading: false,
    unstakeMode: UnstakeMode.INSTANT,
    setAmount: () => {},
    setUnstakeMode: () => {},
    sendTransaction: () => Promise.resolve(),
    onChangeDirection: () => {},
    isSendingTransaction: false,
    isReversed: false,
    toggleReversed: () => {},
    reversedAmount: '0',
});

/**
 * Hook to access the staking context.
 * Must be used within a StakingWidgetProvider (or StakingWidget).
 */
export const useStakingContext = () => {
    return useContext(StakingContext);
};

/**
 * Props for the StakingWidgetProvider.
 */
export interface StakingProviderProps extends PropsWithChildren {
    /**
     * Network to use for quote fetching and transactions.
     * When omitted, uses the selected wallet's network.
     */
    network?: Network;
}

export const StakingWidgetProvider: FC<StakingProviderProps> = ({ children, network: networkProp }) => {
    const [amount, setAmountRaw] = useState('');
    const [unstakeMode, setUnstakeMode] = useState<UnstakeModes>(UnstakeMode.INSTANT);
    const [direction, setDirection] = useState<StakingQuoteDirection>('stake');
    const [isReversed, setIsReversed] = useState(false);

    const walletNetwork = useNetwork();
    const network = networkProp ?? walletNetwork;

    const address = useAddress();

    const { data: providerInfo, isLoading: isProviderInfoLoading } = useStakingProviderInfo({ network });
    const providerMetadata = useStakingProviderMetadata({ network });

    const isNativeTon = providerMetadata?.stakeToken.address === 'ton';

    const { data: nativeBalanceData, isLoading: isNativeBalanceLoading } = useBalance({
        query: { enabled: isNativeTon, refetchInterval: 5000 },
    });

    const { data: jettonBalanceData, isLoading: isJettonBalanceLoading } = useJettonBalanceByAddress({
        jettonAddress: !isNativeTon ? providerMetadata?.stakeToken.address : undefined,
        ownerAddress: address ?? undefined,
        network,
        query: { enabled: !isNativeTon && !!providerMetadata?.stakeToken.address && !!address, refetchInterval: 5000 },
    });

    const balance = isNativeTon ? nativeBalanceData : jettonBalanceData;
    const isBalanceLoading = isNativeTon ? isNativeBalanceLoading : isJettonBalanceLoading;

    const { data: stakedBalanceData, isLoading: isStakedBalanceLoading } = useStakedBalance({
        userAddress: address ?? undefined,
        network,
        query: { refetchInterval: 5000 },
    });

    const { mutateAsync: buildTransaction } = useBuildStakeTransaction();
    const { mutateAsync: sendTransaction, isPending: isSendingTransaction } = useSendTransaction();

    const amountDecimals = useMemo(() => {
        const unstakeDecimals = isReversed
            ? providerMetadata?.stakeToken.decimals
            : providerMetadata?.receiveToken?.decimals;
        return direction === 'stake' ? providerMetadata?.stakeToken.decimals : unstakeDecimals;
    }, [direction, providerMetadata?.stakeToken.decimals, providerMetadata?.receiveToken?.decimals, isReversed]);

    const setAmount = useCallback(
        (value: string) => {
            if (value === '' || validateNumericString(value, amountDecimals)) setAmountRaw(value);
        },
        [amountDecimals],
    );

    const [quoteParamsDebounced] = useDebounceValue<UseStakingQuoteParameters>(
        {
            direction,
            amount,
            unstakeMode,
            isReversed,
            network,
            query: { placeholderData: keepPreviousData },
        },
        500,
    );

    const { data: quote, isFetching: isQuoteLoading, error: quoteError } = useStakingQuote(quoteParamsDebounced);

    const reversedAmount = useMemo(() => {
        if (direction === 'stake') return quote?.amountOut || '0';
        if (isReversed) return quote?.amountIn || '0';
        if (!quote?.amountIn) return '0';

        return convertByRate(quote.amountIn, providerInfo?.exchangeRate, providerMetadata?.stakeToken.decimals) || '0';
    }, [
        direction,
        isReversed,
        quote?.amountOut,
        quote?.amountIn,
        providerInfo?.exchangeRate,
        providerMetadata?.stakeToken.decimals,
    ]);

    const toggleReversed = useCallback(() => {
        setAmountRaw(reversedAmount);
        setIsReversed((prev) => !prev);
    }, [reversedAmount]);

    const handleSendTransaction = useCallback(async () => {
        if (!quote || !address) return;

        const transactionParams = await buildTransaction({ quote, userAddress: address });

        await sendTransaction(transactionParams);
    }, [quote, address, buildTransaction, sendTransaction]);

    const { error, canSubmit } = useStakingValidation({
        amount,
        amountDebounced: quoteParamsDebounced.amount || '',
        balance,
        quoteError,
        direction,
        stakedBalance: stakedBalanceData?.stakedBalance,
        quote,
        isReversed,
        amountDecimals,
    });

    const value = useMemo(
        () => ({
            amount,
            canSubmit,
            direction,
            quote,
            isQuoteLoading: isQuoteLoading || isProviderInfoLoading || amount !== quoteParamsDebounced.amount,
            error,
            providerInfo,
            providerMetadata,
            isProviderInfoLoading,
            balance,
            isBalanceLoading,
            stakedBalance: stakedBalanceData,
            isStakedBalanceLoading,
            unstakeMode,
            setAmount,
            setUnstakeMode,
            sendTransaction: handleSendTransaction,
            isSendingTransaction,
            isReversed,
            toggleReversed,
            reversedAmount,
            onChangeDirection: setDirection,
        }),
        [
            amount,
            quoteParamsDebounced.amount,
            canSubmit,
            direction,
            quote,
            isQuoteLoading,
            error,
            providerInfo,
            providerMetadata,
            isProviderInfoLoading,
            balance,
            isBalanceLoading,
            stakedBalanceData,
            isStakedBalanceLoading,
            unstakeMode,
            setAmount,
            setUnstakeMode,
            handleSendTransaction,
            isSendingTransaction,
            isReversed,
            toggleReversed,
            reversedAmount,
            setDirection,
        ],
    );

    return <StakingContext.Provider value={value}>{children}</StakingContext.Provider>;
};
