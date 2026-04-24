/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { FC, PropsWithChildren } from 'react';
import { formatUnits } from '@ton/appkit';
import type { Network } from '@ton/appkit';
import type { GetSwapQuoteData } from '@ton/appkit/queries';
import type { SwapProvider } from '@ton/appkit';
import { getTonShortfall } from '@ton/appkit';
import type { TonShortfall } from '@ton/appkit';
import { calcMaxSpendable } from '@ton/appkit';

import { useSwapQuote } from '../../hooks/use-swap-quote';
import { useSwapProvider } from '../../hooks/use-swap-provider';
import { useSwapProviders } from '../../hooks/use-swap-providers';
import { useBuildSwapTransaction } from '../../hooks/use-build-swap-transaction';
import { useAddress } from '../../../wallets';
import { useBalance } from '../../../balances/hooks/use-balance';
import { useNetwork } from '../../../network';
import { useSendTransaction } from '../../../transaction/hooks/use-send-transaction';
import { useDebounceValue } from '../../../../hooks/use-debounce-value';
import type { AppkitUIToken } from '../../../../types/appkit-ui-token';
import type { TokenSectionConfig } from '../../../../components/token-select-modal';
import { mapSwapWidgetTokens } from '../../utils/map-swap-widget-tokens';
import { useSwapTokenState } from './use-swap-token-state';
import { useSwapBalances } from './use-swap-balances';
import { useSwapValidation } from './use-swap-validation';

export type { AppkitUIToken };

/**
 * Context type for the SwapWidget.
 * Provides all necessary state and actions for building custom swap UIs.
 */
export interface SwapContextType {
    /** Full list of available tokens for swapping */
    tokens: AppkitUIToken[];
    /** Optional section configs for grouping tokens in the selector */
    tokenSections?: TokenSectionConfig[];
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
    /** True while the "from" balance is being fetched */
    isFromBalanceLoading: boolean;
    /** True while the "to" balance is being fetched */
    isToBalanceLoading: boolean;
    /** Whether the user can proceed with the swap (checks balance, amount, quote) */
    canSubmit: boolean;
    /** Raw swap quote from the provider */
    quote: GetSwapQuoteData | undefined;
    /** True while the quote is being fetched from the API */
    isQuoteLoading: boolean;
    /** Current validation or fetch error, null when everything is ok */
    error: string | null;
    /** Slippage tolerance in basis points (100 = 1%) */
    slippage: number;
    /** Currently selected swap provider (defaults to the first registered one) */
    swapProvider: SwapProvider | undefined;
    /** All registered swap providers */
    swapProviders: SwapProvider[];
    /** Updates the selected swap provider */
    setSwapProviderId: (providerId: string) => void;
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
    /** `reduce` when the outgoing token is TON (user can fix by changing amount), `topup` otherwise. */
    lowBalanceMode: 'reduce' | 'topup';
    /** Required TON amount for the pending operation, formatted as a decimal string. Empty when no pending op. */
    lowBalanceRequiredTon: string;
    /** Replace the input with a value that fits into the current TON balance and close the warning */
    onLowBalanceChange: () => void;
    /** Dismiss the low-balance warning without changing the input */
    onLowBalanceCancel: () => void;
}

export const SwapContext = createContext<SwapContextType>({
    tokens: [],
    tokenSections: undefined,
    fromToken: null,
    toToken: null,
    fromAmount: '',
    toAmount: '',
    fiatSymbol: '$',
    fromBalance: undefined,
    toBalance: undefined,
    isFromBalanceLoading: false,
    isToBalanceLoading: false,
    canSubmit: false,
    quote: undefined,
    isQuoteLoading: false,
    error: null,
    slippage: 50,
    swapProvider: undefined,
    swapProviders: [],
    setSwapProviderId: () => {},
    setFromToken: () => {},
    setToToken: () => {},
    setFromAmount: () => {},
    setSlippage: () => {},
    onFlip: () => {},
    onMaxClick: () => {},
    sendSwapTransaction: () => Promise.resolve(),
    isSendingTransaction: false,
    isLowBalanceWarningOpen: false,
    lowBalanceMode: 'reduce',
    lowBalanceRequiredTon: '',
    onLowBalanceChange: () => {},
    onLowBalanceCancel: () => {},
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
    /** Optional section configs for grouping tokens in the selector */
    tokenSections?: TokenSectionConfig[];
    /** Id of the token pre-selected in the "from" field */
    defaultFromId?: string;
    /** Id of the token pre-selected in the "to" field */
    defaultToId?: string;
    /** Initial slippage in basis points (100 = 1%), defaults to 50 (0.5%) */
    /** Network to use for quote fetching. When omitted, uses the selected wallet's network. */
    network?: Network;
    /** Fiat currency symbol for price display, defaults to "$" */
    fiatSymbol?: string;
    /** Initial slippage in basis points (100 = 1%), defaults to 100 (1%) */
    defaultSlippage?: number;
}

export const SwapWidgetProvider: FC<SwapProviderProps> = ({
    children,
    tokens,
    tokenSections,
    network: networkProp,
    fiatSymbol = '$',
    defaultFromId,
    defaultToId,
    defaultSlippage = 100,
}) => {
    // Input prep — derived from props, consumed by local-state hooks below.
    const mappedTokens = useMemo(() => mapSwapWidgetTokens(tokens), [tokens]);

    // 2. Queries and external readers (hoisted: `network` gates token filtering for local state below)
    const walletNetwork = useNetwork();
    const network = networkProp ?? walletNetwork;

    const networkFilteredTokens = useMemo(
        () => (network ? mappedTokens.filter((t) => t.network.chainId === network.chainId) : mappedTokens),
        [mappedTokens, network],
    );

    // 1. Local state
    const { fromToken, toToken, fromAmount, setFromToken, setToToken, setFromAmount, onFlip } = useSwapTokenState({
        mappedTokens: networkFilteredTokens,
        defaultFromId,
        defaultToId,
    });
    const [slippage, setSlippage] = useState(defaultSlippage);
    const [fromAmountDebounced] = useDebounceValue(fromAmount, 500);
    const [pendingSwap, setPendingSwap] = useState<TonShortfall | undefined>(undefined);
    const address = useAddress();
    const [swapProvider, setSwapProviderId] = useSwapProvider();
    const swapProviders = useSwapProviders();

    // Stabilized query inputs — kept next to the query that consumes them.
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

    const isNetworkSupported = useMemo(
        () =>
            !swapProvider || !network || swapProvider.getSupportedNetworks().some((n) => n.chainId === network.chainId),
        [swapProvider, network],
    );

    const {
        data: quote,
        isFetching: isQuoteFetching,
        error: quoteError,
    } = useSwapQuote({
        from: fromTokenParam,
        to: toTokenParam,
        amount: fromAmountDebounced,
        network,
        slippageBps: slippage,
        providerId: swapProvider?.providerId,
        query: { enabled: isNetworkSupported },
    });
    // Also show "loading" while the user is still typing (debounce in-flight) so the UI doesn't flash
    // the previous quote as if it were final.
    const isQuoteLoading = isQuoteFetching || fromAmount !== fromAmountDebounced;
    const { fromBalance, toBalance, isFromBalanceLoading, isToBalanceLoading } = useSwapBalances({
        fromToken,
        toToken,
        ownerAddress: address ?? undefined,
        network,
    });
    const { data: tonBalance } = useBalance({ network, query: { refetchInterval: 5000 } });

    // 3. Derivations
    const toAmount = quote?.toAmount ?? '';
    const { error, canSubmit } = useSwapValidation({
        fromAmount,
        fromAmountDebounced,
        fromToken,
        toToken,
        fromBalance,
        quoteError,
        isNetworkSupported,
    });
    const isLowBalanceWarningOpen = pendingSwap !== undefined;
    const lowBalanceMode: 'reduce' | 'topup' = pendingSwap?.mode ?? 'reduce';
    const lowBalanceRequiredTon = useMemo(() => {
        if (!pendingSwap) return '';
        return formatUnits(pendingSwap.requiredNanos, 9);
    }, [pendingSwap]);

    // 4. Mutations
    const { mutateAsync: buildTransaction, isPending: isBuildingTransaction } = useBuildSwapTransaction();
    const { mutateAsync: sendTransaction, isPending: isSendingPending } = useSendTransaction();
    const isSendingTransaction = isBuildingTransaction || isSendingPending;

    // 5. Callbacks
    const handleMaxClick = useCallback(() => {
        if (!fromBalance || !fromToken) return;
        setFromAmount(calcMaxSpendable({ balance: fromBalance, token: fromToken, feeReserveNanos: 350_000_000n }));
    }, [fromBalance, fromToken, setFromAmount]);

    const sendSwapTransaction = useCallback(async () => {
        if (!quote || !address || !fromToken) return;

        const tx = await buildTransaction({ quote, userAddress: address });

        const shortfall = getTonShortfall({
            messages: tx.messages,
            tonBalance,
            fromToken,
            fromAmount,
        });

        if (shortfall) {
            setPendingSwap(shortfall);
            return;
        }

        await sendTransaction(tx);
    }, [quote, address, fromToken, fromAmount, buildTransaction, sendTransaction, tonBalance]);

    const onLowBalanceChange = useCallback(() => {
        if (!pendingSwap || pendingSwap.mode !== 'reduce') return;
        setFromAmount(pendingSwap.suggestedFromAmount);
        setPendingSwap(undefined);
    }, [pendingSwap, setFromAmount]);

    const onLowBalanceCancel = useCallback(() => {
        setPendingSwap(undefined);
    }, []);

    const value = useMemo(
        () => ({
            tokens: networkFilteredTokens,
            tokenSections,
            fromToken,
            toToken,
            fromAmount,
            toAmount,
            fiatSymbol,
            fromBalance,
            toBalance,
            isFromBalanceLoading,
            isToBalanceLoading,
            canSubmit,
            quote,
            isQuoteLoading,
            error,
            slippage,
            swapProvider,
            swapProviders,
            setSwapProviderId,
            setFromToken,
            setToToken,
            setFromAmount,
            setSlippage,
            onFlip,
            onMaxClick: handleMaxClick,
            sendSwapTransaction,
            isSendingTransaction,
            isLowBalanceWarningOpen,
            lowBalanceMode,
            lowBalanceRequiredTon,
            onLowBalanceChange,
            onLowBalanceCancel,
        }),
        [
            networkFilteredTokens,
            tokenSections,
            fromToken,
            toToken,
            fromAmount,
            toAmount,
            fiatSymbol,
            fromBalance,
            toBalance,
            isFromBalanceLoading,
            isToBalanceLoading,
            canSubmit,
            quote,
            isQuoteLoading,
            error,
            slippage,
            swapProvider,
            swapProviders,
            setSwapProviderId,
            setFromToken,
            setToToken,
            setFromAmount,
            setSlippage,
            onFlip,
            handleMaxClick,
            sendSwapTransaction,
            isSendingTransaction,
            isLowBalanceWarningOpen,
            lowBalanceMode,
            lowBalanceRequiredTon,
            onLowBalanceChange,
            onLowBalanceCancel,
        ],
    );

    return <SwapContext.Provider value={value}>{children}</SwapContext.Provider>;
};
