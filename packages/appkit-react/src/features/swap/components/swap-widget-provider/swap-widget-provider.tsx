/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { FC, PropsWithChildren } from 'react';
import { formatUnits, parseUnits } from '@ton/appkit';
import type { Network } from '@ton/appkit';
import type { GetSwapQuoteData } from '@ton/appkit/queries';

import { useSwapQuote } from '../../hooks/use-swap-quote';
import { useBuildSwapTransaction } from '../../hooks/use-build-swap-transaction';
import { useAddress } from '../../../wallets';
import { useBalance } from '../../../balances/hooks/use-balance';
import { useNetwork } from '../../../network';
import { useSendTransaction } from '../../../transaction/hooks/use-send-transaction';
import { useDebounceValue } from '../../../../hooks/use-debounce-value';
import type { AppkitUIToken } from '../../../../types/appkit-ui-token';
import { mapSwapWidgetTokens } from '../../utils/map-swap-widget-tokens';
import { useSwapTokenState } from './use-swap-token-state';
import { useSwapBalances } from './use-swap-balances';
import { useSwapValidation } from './use-swap-validation';

/** Reserve (in TON) subtracted from balance on MAX click for native TON swaps. */
const TON_FEE_RESERVE = 0.3;
/** Extra TON buffer added on top of built transaction outflow when checking balance before sending. */
const TON_GAS_BUFFER_NANOS = 100_000_000n;

export type { AppkitUIToken };

export type SwapWidgetError = 'insufficientBalance' | 'tooManyDecimals' | 'quoteError' | null;

/**
 * Context type for the SwapWidget.
 * Provides all necessary state and actions for building custom swap UIs.
 */
export interface SwapContextType {
    /** Full list of available tokens for swapping */
    tokens: AppkitUIToken[];
    /** Currently selected source token */
    fromToken: AppkitUIToken | null;
    /** Currently selected target token */
    toToken: AppkitUIToken | null;
    /** Amount the user wants to swap (string to preserve input UX) */
    fromAmount: string;
    /** Calculated receive amount from the current quote */
    toAmount: string;
    /** Fiat currency symbol for price display, e.g. "$" */
    fiatSymbol: string;
    /** User's balance of the "from" token */
    fromBalance: string | undefined;
    /** User's balance of the "to" token */
    toBalance: string | undefined;
    /** Whether the user can proceed with the swap (checks balance, amount, quote) */
    canSubmit: boolean;
    /** Raw swap quote from the provider */
    quote: GetSwapQuoteData | undefined;
    /** True while the quote is being fetched from the API */
    isQuoteLoading: boolean;
    /** Current validation or fetch error, null when everything is ok */
    error: SwapWidgetError;
    /** Slippage tolerance in basis points (100 = 1%) */
    slippage: number;
    /** Updates the source token */
    setFromToken: (token: AppkitUIToken) => void;
    /** Updates the target token */
    setToToken: (token: AppkitUIToken) => void;
    /** Updates the swap amount */
    setFromAmount: (amount: string) => void;
    /** Updates the slippage tolerance */
    setSlippage: (slippage: number) => void;
    /** Swaps source and target tokens */
    onFlip: () => void;
    /** Sets the "from" amount to the maximum available balance */
    onMaxClick: () => void;
    /** Executes the swap transaction */
    sendSwapTransaction: () => Promise<void>;
    /** True while a transaction is being built or sent */
    isSendingTransaction: boolean;
    /** True when the built transaction outflow exceeds the user's TON balance */
    isLowBalanceWarningOpen: boolean;
    /** Required TON amount for the pending swap, formatted as a decimal string. Empty when no pending swap. */
    pendingSwapRequiredTon: string;
    /** Replace fromAmount with a value that fits into the current TON balance and close the warning */
    changePendingSwap: () => void;
    /** Dismiss the low-balance warning without changing the amount */
    cancelPendingSwap: () => void;
}

export const SwapContext = createContext<SwapContextType>({
    tokens: [],
    fromToken: null,
    toToken: null,
    fromAmount: '',
    toAmount: '',
    fiatSymbol: '$',
    fromBalance: undefined,
    toBalance: undefined,
    canSubmit: false,
    quote: undefined,
    isQuoteLoading: false,
    error: null,
    slippage: 50,
    setFromToken: () => {},
    setToToken: () => {},
    setFromAmount: () => {},
    setSlippage: () => {},
    onFlip: () => {},
    onMaxClick: () => {},
    sendSwapTransaction: () => Promise.resolve(),
    isSendingTransaction: false,
    isLowBalanceWarningOpen: false,
    pendingSwapRequiredTon: '',
    changePendingSwap: () => {},
    cancelPendingSwap: () => {},
});

/**
 * Hook to access the swap context.
 * Must be used within a SwapWidgetProvider (or SwapWidget).
 */
export function useSwapContext() {
    return useContext(SwapContext);
}

/**
 * Props for the SwapWidgetProvider.
 */
export interface SwapProviderProps extends PropsWithChildren {
    /** Full list of tokens available for swapping in the UI */
    tokens: AppkitUIToken[];
    /** Network to use for quote fetching. When omitted, uses the selected wallet's network. */
    network?: Network;
    /** Fiat currency symbol for price display, defaults to "$" */
    fiatSymbol?: string;
    /** Ticker of the token pre-selected for the source */
    defaultFromSymbol?: string;
    /** Ticker of the token pre-selected for the target */
    defaultToSymbol?: string;
    /** Initial slippage in basis points (100 = 1%), defaults to 100 (1%) */
    defaultSlippage?: number;
}

export const SwapWidgetProvider: FC<SwapProviderProps> = ({
    children,
    tokens,
    network: networkProp,
    fiatSymbol = '$',
    defaultFromSymbol,
    defaultToSymbol,
    defaultSlippage = 100,
}) => {
    const walletNetwork = useNetwork();
    const network = networkProp ?? walletNetwork;
    const mappedTokens = useMemo(() => mapSwapWidgetTokens(tokens), [tokens]);

    const { fromToken, toToken, fromAmount, setFromToken, setToToken, setFromAmount, onFlip } = useSwapTokenState({
        mappedTokens,
        defaultFromSymbol,
        defaultToSymbol,
    });

    const [slippage, setSlippage] = useState(defaultSlippage);

    const fromTokenParam = useMemo(
        () =>
            fromToken
                ? {
                      address: fromToken.address,
                      decimals: fromToken.decimals,
                      symbol: fromToken.symbol,
                      name: fromToken.name,
                  }
                : undefined,
        [fromToken],
    );

    const toTokenParam = useMemo(
        () =>
            toToken
                ? { address: toToken.address, decimals: toToken.decimals, symbol: toToken.symbol, name: toToken.name }
                : undefined,
        [toToken],
    );

    const [fromAmountDebounced] = useDebounceValue(fromAmount, 500);

    const {
        data: quote,
        isFetching: isQuoteLoading,
        error: quoteError,
    } = useSwapQuote({
        from: fromTokenParam,
        to: toTokenParam,
        amount: fromAmountDebounced,
        network,
        slippageBps: slippage,
    });

    const toAmount = quote?.toAmount ?? '';

    const address = useAddress();

    const { fromBalance, toBalance } = useSwapBalances({
        fromToken,
        toToken,
        ownerAddress: address ?? undefined,
    });
    const { data: tonBalance } = useBalance();

    const handleMaxClick = useCallback(() => {
        if (!fromBalance || !fromToken) return;
        const clean = fromBalance.replace(/\s/g, '');
        if (fromToken.address === 'ton') {
            const balanceNanos = parseUnits(clean, fromToken.decimals);
            const reserveNanos = parseUnits(TON_FEE_RESERVE.toString(), fromToken.decimals);
            const reducedNanos = balanceNanos > reserveNanos ? balanceNanos - reserveNanos : 0n;
            setFromAmount(formatUnits(reducedNanos, fromToken.decimals));
            return;
        }
        setFromAmount(clean);
    }, [fromBalance, fromToken, setFromAmount]);

    const { mutateAsync: buildTransaction, isPending: isBuildingTransaction } = useBuildSwapTransaction();
    const { mutateAsync: sendTransaction, isPending: isSendingPending } = useSendTransaction();

    const [pendingSwap, setPendingSwap] = useState<{
        requiredNanos: bigint;
        suggestedFromAmount: string;
    } | null>(null);

    const sendSwapTransaction = useCallback(async () => {
        if (!quote || !address || !fromToken) return;

        const tx = await buildTransaction({ quote, userAddress: address });

        const totalOutNanos = tx.messages.reduce((acc, m) => acc + BigInt(m.amount), 0n);
        const requiredNanos = totalOutNanos + TON_GAS_BUFFER_NANOS;
        const tonBalanceNanos = tonBalance ? parseUnits(tonBalance, 9) : 0n;

        if (tonBalanceNanos < requiredNanos) {
            const diff = totalOutNanos - parseUnits(fromAmount, 9) + parseUnits('0.02', 9);
            const suggestedFromAmount = formatUnits(tonBalanceNanos - diff - TON_GAS_BUFFER_NANOS, 9);
            setPendingSwap({ requiredNanos, suggestedFromAmount });
            return;
        }

        await sendTransaction(tx);
    }, [quote, address, fromToken, fromAmount, buildTransaction, sendTransaction, tonBalance]);

    const changePendingSwap = useCallback(() => {
        if (!pendingSwap) return;
        setFromAmount(pendingSwap.suggestedFromAmount);
        setPendingSwap(null);
    }, [pendingSwap, setFromAmount]);

    const cancelPendingSwap = useCallback(() => {
        setPendingSwap(null);
    }, []);

    const isSendingTransaction = isBuildingTransaction || isSendingPending;
    const isLowBalanceWarningOpen = pendingSwap !== null;
    const pendingSwapRequiredTon = useMemo(() => {
        if (!pendingSwap) return '';
        return formatUnits(pendingSwap.requiredNanos, 9);
    }, [pendingSwap]);

    const { error, canSubmit } = useSwapValidation({
        fromAmount,
        fromAmountDebounced,
        fromToken,
        toToken,
        fromBalance,
        quoteError,
    });

    const value = useMemo(
        () => ({
            tokens: mappedTokens,
            fromToken,
            toToken,
            fromAmount,
            toAmount,
            fiatSymbol,
            fromBalance,
            toBalance,
            canSubmit,
            quote,
            isQuoteLoading,
            error,
            slippage,
            setFromToken,
            setToToken,
            setFromAmount,
            setSlippage,
            onFlip,
            onMaxClick: handleMaxClick,
            sendSwapTransaction,
            isSendingTransaction,
            isLowBalanceWarningOpen,
            pendingSwapRequiredTon,
            changePendingSwap,
            cancelPendingSwap,
        }),
        [
            mappedTokens,
            fromToken,
            toToken,
            fromAmount,
            toAmount,
            fiatSymbol,
            fromBalance,
            toBalance,
            canSubmit,
            quote,
            isQuoteLoading,
            error,
            slippage,
            setFromToken,
            setToToken,
            setFromAmount,
            setSlippage,
            onFlip,
            handleMaxClick,
            sendSwapTransaction,
            isSendingTransaction,
            isLowBalanceWarningOpen,
            pendingSwapRequiredTon,
            changePendingSwap,
            cancelPendingSwap,
        ],
    );

    return <SwapContext.Provider value={value}>{children}</SwapContext.Provider>;
};
