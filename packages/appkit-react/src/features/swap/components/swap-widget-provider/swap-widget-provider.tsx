/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { FC, PropsWithChildren } from 'react';
import type { Network } from '@ton/appkit';
import type { GetSwapQuoteData } from '@ton/appkit/queries';

import { useSwapQuote } from '../../hooks/use-swap-quote';
import { useBuildSwapTransaction } from '../../hooks/use-build-swap-transaction';
import { useAddress } from '../../../wallets';
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

export type SwapWidgetError = 'insufficientBalance' | 'tooManyDecimals' | 'quoteError' | null;

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
    /** True while a transaction is being sent or processed */
    isSendingTransaction: boolean;
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
    const walletNetwork = useNetwork();
    const network = networkProp ?? walletNetwork;
    const mappedTokens = useMemo(() => mapSwapWidgetTokens(tokens), [tokens]);

    const { fromToken, toToken, fromAmount, setFromToken, setToToken, setFromAmount, onFlip } = useSwapTokenState({
        mappedTokens,
        defaultFromId,
        defaultToId,
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

    const handleMaxClick = useCallback(() => {
        if (fromBalance) {
            setFromAmount(fromBalance.replace(/\s/g, ''));
        }
    }, [fromBalance, setFromAmount]);

    const { mutateAsync: buildTransaction } = useBuildSwapTransaction();
    const { mutateAsync: sendTransaction, isPending: isSendingTransaction } = useSendTransaction();

    const sendSwapTransaction = useCallback(async () => {
        if (!quote || !address) return;

        const transactionParams = await buildTransaction({ quote, userAddress: address });

        await sendTransaction(transactionParams);
    }, [quote, address, buildTransaction, sendTransaction]);

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
            tokenSections,
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
        }),
        [
            mappedTokens,
            tokenSections,
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
        ],
    );

    return <SwapContext.Provider value={value}>{children}</SwapContext.Provider>;
};
