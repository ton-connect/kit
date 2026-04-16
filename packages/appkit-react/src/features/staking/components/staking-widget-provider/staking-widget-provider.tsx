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

import { useStakingQuote } from '../../hooks/use-staking-quote';
import { useStakingProviderInfo } from '../../hooks/use-staking-provider-info';
import { useStakingProviderMetadata } from '../../hooks/use-staking-provider-metadata';
import { useStakedBalance } from '../../hooks/use-staked-balance';
import { useBuildStakeTransaction } from '../../hooks/use-build-stake-transaction';
import { useSelectedWallet, useAddress } from '../../../wallets';
import { useBalance } from '../../../balances/hooks/use-balance';
import { useSendTransaction } from '../../../transaction/hooks/use-send-transaction';
import { useDebounceValue } from '../../../../hooks/use-debounce-value';
import { useStakingValidation } from './use-staking-validation';

export type StakingWidgetError = 'insufficientBalance' | 'tooManyDecimals' | 'quoteError' | null;

export interface StakingContextType {
    /** Amount the user wants to stake (string to preserve input UX) */
    amount: string;
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
    /** Staking provider dynamic info (APY, instant unstake availability, etc.) */
    providerInfo: StakingProviderInfo | undefined;
    /** Staking provider static metadata */
    providerMetadata: StakingProviderMetadata | undefined;
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
    sendTransaction: () => Promise<void>;
    onChangeDirection: (direction: StakingQuoteDirection) => void;
    isSendingTransaction: boolean;
    isReversed: boolean;
    toggleReversed: () => void;
}

export const StakingContext = createContext<StakingContextType>({
    amount: '',
    canSubmit: false,
    isWalletConnected: false,
    quote: undefined,
    isQuoteLoading: false,
    error: null,
    providerInfo: undefined,
    providerMetadata: undefined,
    direction: 'stake',
    isProviderInfoLoading: false,
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
});

export const useStakingContext = () => {
    return useContext(StakingContext);
};

export interface StakingProviderProps extends PropsWithChildren {
    /** Network to use for quote fetching */
    network: Network;
}

export const StakingWidgetProvider: FC<StakingProviderProps> = ({ children, network }) => {
    const [amount, setAmountRaw] = useState('');
    const [unstakeMode, setUnstakeMode] = useState<UnstakeModes>(UnstakeMode.INSTANT);
    const [direction, setDirection] = useState<StakingQuoteDirection>('stake');
    const [isReversed, setIsReversed] = useState(false);

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
    const providerMetadata = useStakingProviderMetadata({ network });

    const { mutateAsync: buildTransaction } = useBuildStakeTransaction();
    const { mutateAsync: sendTransaction, isPending: isSendingTransaction } = useSendTransaction();

    const amountDecimals = useMemo(() => {
        const unstakeDecimals = isReversed ? providerMetadata?.lstDecimals : providerMetadata?.stakeCoinDecimals;
        return direction === 'stake' ? providerMetadata?.stakeCoinDecimals : unstakeDecimals;
    }, [direction, providerMetadata?.stakeCoinDecimals, providerMetadata?.lstDecimals, isReversed]);

    const setAmount = useCallback(
        (value: string) => {
            if (value === '' || validateNumericString(value, amountDecimals)) setAmountRaw(value);
        },
        [amountDecimals],
    );

    const toggleReversed = useCallback(() => {
        setIsReversed((prev) => !prev);
    }, []);

    const [amountDebounced] = useDebounceValue(amount, 500);

    const {
        data: quote,
        isFetching: isQuoteLoading,
        error: quoteError,
    } = useStakingQuote({
        direction,
        amount: amountDebounced,
        unstakeMode,
        isReversed,
        network,
    });

    const handleSendTransaction = useCallback(async () => {
        if (!quote || !address) return;

        const transactionParams = await buildTransaction({ quote, userAddress: address });

        await sendTransaction(transactionParams);
    }, [quote, address, buildTransaction, sendTransaction]);

    const { error, canSubmit } = useStakingValidation({
        amount,
        amountDebounced,
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
            isWalletConnected,
            quote,
            isQuoteLoading: isQuoteLoading || isProviderInfoLoading || amount !== amountDebounced,
            error,
            providerInfo,
            providerMetadata,
            isProviderInfoLoading,
            stakedBalance: stakedBalanceData,
            isStakedBalanceLoading,
            unstakeMode,
            setAmount,
            setUnstakeMode,
            sendTransaction: handleSendTransaction,
            isSendingTransaction,
            isReversed,
            toggleReversed,
            onChangeDirection: setDirection,
        }),
        [
            amount,
            amountDebounced,
            canSubmit,
            isWalletConnected,
            direction,
            quote,
            isQuoteLoading,
            error,
            providerInfo,
            providerMetadata,
            isProviderInfoLoading,
            stakedBalanceData,
            isStakedBalanceLoading,
            unstakeMode,
            setAmount,
            setUnstakeMode,
            handleSendTransaction,
            isSendingTransaction,
            isReversed,
            toggleReversed,
            setDirection,
        ],
    );

    return <StakingContext.Provider value={value}>{children}</StakingContext.Provider>;
};
