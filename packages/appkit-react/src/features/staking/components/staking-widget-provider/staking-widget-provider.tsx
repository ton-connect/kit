/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { FC, PropsWithChildren } from 'react';
import type { Network, StakingQuoteDirection, TonShortfall } from '@ton/appkit';
import { calcMaxSpendable, formatUnits, getTonShortfall, validateNumericString } from '@ton/appkit';
import type {
    StakingQuote,
    StakingProviderInfo,
    StakingBalance,
    UnstakeModes,
    StakingProviderMetadata,
} from '@ton/appkit';
import { UnstakeMode } from '@ton/appkit';

import { useNetwork } from '../../../network';
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
    /** Sets the input amount to the maximum available balance (leaves room for TON gas on native stake) */
    onMaxClick: () => void;
    /** True when the built transaction outflow exceeds the user's TON balance */
    isLowBalanceWarningOpen: boolean;
    /** `reduce` when the outgoing token is TON (user can fix by changing amount), `topup` otherwise. */
    pendingStakeMode: 'reduce' | 'topup';
    /** Required TON amount for the pending stake/unstake, formatted as a decimal string. Empty when no pending op. */
    pendingStakeRequiredTon: string;
    /** Replace amount with a value that fits into the current TON balance and close the warning */
    changePendingStake: () => void;
    /** Dismiss the low-balance warning without changing the amount */
    cancelPendingStake: () => void;
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
    onMaxClick: () => {},
    isLowBalanceWarningOpen: false,
    pendingStakeMode: 'reduce',
    pendingStakeRequiredTon: '',
    changePendingStake: () => {},
    cancelPendingStake: () => {},
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
    const [pendingStake, setPendingStake] = useState<TonShortfall | undefined>(undefined);

    const walletNetwork = useNetwork();
    const network = networkProp ?? walletNetwork;

    const address = useAddress();

    const { data: providerInfo, isLoading: isProviderInfoLoading } = useStakingProviderInfo({ network });
    const providerMetadata = useStakingProviderMetadata({ network });

    const isNativeTon = providerMetadata?.stakeToken.address === 'ton';

    // Always fetch TON balance: even when the stake token is a jetton we need it to check whether the user has
    // enough TON to cover network fees before sending.
    const { data: nativeBalanceData, isLoading: isNativeBalanceLoading } = useBalance({
        query: { refetchInterval: 5000 },
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
        },
        500,
    );

    const { data: quote, isFetching: isQuoteLoading, error: quoteError } = useStakingQuote(quoteParamsDebounced);

    const reversedAmount = useMemo(() => {
        if (direction === 'unstake' && isReversed) return quote?.amountIn || '0';
        return quote?.amountOut || '0';
    }, [direction, isReversed, quote?.amountOut, quote?.amountIn]);

    const toggleReversed = useCallback(() => {
        setAmountRaw(reversedAmount);
        setIsReversed((prev) => !prev);
    }, [reversedAmount]);

    const handleMaxClick = useCallback(() => {
        const outgoingToken = direction === 'stake' ? providerMetadata?.stakeToken : providerMetadata?.receiveToken;
        const available = direction === 'stake' ? balance : stakedBalanceData?.stakedBalance;

        if (direction === 'unstake') setIsReversed(false);

        if (!available || !outgoingToken) {
            setAmountRaw(available ?? '');
            return;
        }

        setAmountRaw(calcMaxSpendable({ balance: available, token: outgoingToken, feeReserveNanos: 1_200_000_000n }));
    }, [
        direction,
        balance,
        stakedBalanceData?.stakedBalance,
        providerMetadata?.stakeToken,
        providerMetadata?.receiveToken,
    ]);

    const handleSendTransaction = useCallback(async () => {
        if (!quote || !address || !providerMetadata) return;

        const transactionParams = await buildTransaction({ quote, userAddress: address });

        const outgoingTokenAddress =
            direction === 'stake' ? providerMetadata.stakeToken.address : providerMetadata.receiveToken?.address;

        if (outgoingTokenAddress) {
            const shortfall = getTonShortfall({
                messages: transactionParams.messages,
                tonBalance: nativeBalanceData,
                fromToken: { address: outgoingTokenAddress },
                fromAmount: quote.amountIn,
            });

            if (shortfall) {
                setPendingStake(shortfall);
                return;
            }
        }

        await sendTransaction(transactionParams);
    }, [quote, address, providerMetadata, direction, nativeBalanceData, buildTransaction, sendTransaction]);

    const changePendingStake = useCallback(() => {
        if (!pendingStake || pendingStake.mode !== 'reduce') return;
        // The suggested amount is always a direct (non-reversed) outgoing amount.
        if (isReversed) setIsReversed(false);
        setAmountRaw(pendingStake.suggestedFromAmount);
        setPendingStake(undefined);
    }, [pendingStake, isReversed]);

    const cancelPendingStake = useCallback(() => {
        setPendingStake(undefined);
    }, []);

    const isLowBalanceWarningOpen = pendingStake !== undefined;
    const pendingStakeMode: 'reduce' | 'topup' = pendingStake?.mode ?? 'reduce';
    const pendingStakeRequiredTon = useMemo(() => {
        if (!pendingStake) return '';
        return formatUnits(pendingStake.requiredNanos, 9);
    }, [pendingStake]);

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
            onMaxClick: handleMaxClick,
            onChangeDirection: setDirection,
            isLowBalanceWarningOpen,
            pendingStakeMode,
            pendingStakeRequiredTon,
            changePendingStake,
            cancelPendingStake,
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
            handleMaxClick,
            setDirection,
            isLowBalanceWarningOpen,
            pendingStakeMode,
            pendingStakeRequiredTon,
            changePendingStake,
            cancelPendingStake,
        ],
    );

    return <StakingContext.Provider value={value}>{children}</StakingContext.Provider>;
};
