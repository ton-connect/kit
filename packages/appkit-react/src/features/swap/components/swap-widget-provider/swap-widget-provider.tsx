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
import { validateNumericString } from '@ton/appkit';
import type { GetSwapQuoteData } from '@ton/appkit/queries';

import { useSwapQuote } from '../../hooks/use-swap-quote';
import { useBuildSwapTransaction } from '../../hooks/use-build-swap-transaction';
import { useSelectedWallet, useAddress } from '../../../wallets';
import { useSendTransaction } from '../../../transaction/hooks/use-send-transaction';
import { useDebounceValue } from '../../../../hooks/use-debounce-value';
import { useBalance } from '../../../balances/hooks/use-balance';
import { useJettonBalanceByAddress } from '../../../jettons/hooks/use-jetton-balance-by-address';
import { mapSwapWidgetTokens } from '../../utils/map-swap-widget-tokens';

function truncateDecimals(value: string, maxDecimals: number): string {
    const dotIndex = value.indexOf('.');
    if (dotIndex === -1) return value;
    return value.slice(0, dotIndex + 1 + maxDecimals);
}

export interface SwapWidgetToken {
    /** Token symbol, e.g. "TON" */
    symbol: string;
    /** Full token name, e.g. "Toncoin" */
    name: string;
    /** Number of decimals for the token */
    decimals: number;
    /** Jetton contract address (use "native" for TON) */
    address: string;
    /** Optional token logo */
    logo?: string;
    /** Optional exchange rate: 1 token = rate fiat units (used for fiat value display) */
    rate?: number;
}

export type SwapError = 'insufficientBalance' | 'tooManyDecimals' | 'quoteError' | null;

export interface SwapContextType {
    /** Full list of available tokens */
    tokens: SwapWidgetToken[];
    /** Currently selected "from" token */
    fromToken: SwapWidgetToken | null;
    /** Currently selected "to" token */
    toToken: SwapWidgetToken | null;
    /** Amount the user wants to swap (string to preserve input UX) */
    fromAmount: string;
    /** Calculated receive amount from the quote */
    toAmount: string;
    /** Fiat currency symbol, e.g. "$" */
    fiatSymbol: string;
    /** Fiat value of fromAmount, null when rate is unavailable */
    fromFiatValue: string | null;
    /** Fiat value of toAmount, null when rate is unavailable */
    toFiatValue: string | null;
    /** Balance of the "from" token for the connected wallet */
    fromBalance: string | undefined;
    /** Balance of the "to" token for the connected wallet */
    toBalance: string | undefined;
    /** True while the flip animation should be active */
    isFlipped: boolean;
    /** Whether the user can proceed with the swap */
    canSubmit: boolean;
    /** Whether a wallet is currently connected */
    isWalletConnected: boolean;
    /** Raw swap quote from the provider */
    quote: GetSwapQuoteData | undefined;
    /** True while the quote is being fetched */
    isQuoteLoading: boolean;
    /** Current validation/fetch error, null when everything is ok */
    error: SwapError;
    /** Slippage tolerance in basis points (100 = 1%) */
    slippage: number;
    setFromToken: (token: SwapWidgetToken) => void;
    setToToken: (token: SwapWidgetToken) => void;
    setFromAmount: (amount: string) => void;
    setSlippage: (slippage: number) => void;
    onFlip: () => void;
    onMaxClick: () => void;
    sendSwapTransaction: () => Promise<void>;
    isSendingTransaction: boolean;
}

export const SwapContext = createContext<SwapContextType>({
    tokens: [],
    fromToken: null,
    toToken: null,
    fromAmount: '',
    toAmount: '',
    fiatSymbol: '$',
    fromFiatValue: null,
    toFiatValue: null,
    fromBalance: undefined,
    toBalance: undefined,
    isFlipped: false,
    canSubmit: false,
    isWalletConnected: false,
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

export function useSwapContext() {
    return useContext(SwapContext);
}

export interface SwapProviderProps extends PropsWithChildren {
    /** Full list of tokens available for swapping */
    tokens: SwapWidgetToken[];
    /** Network to use for quote fetching, defaults to mainnet */
    network: Network;
    /** Fiat currency symbol shown next to amounts, defaults to "$" */
    fiatSymbol?: string;
    /** Symbol of the token pre-selected in the "from" field */
    defaultFromSymbol?: string;
    /** Symbol of the token pre-selected in the "to" field */
    defaultToSymbol?: string;
    /** Initial slippage in basis points (100 = 1%), defaults to 50 (0.5%) */
    defaultSlippage?: number;
}

export const SwapWidgetProvider: FC<SwapProviderProps> = ({
    children,
    tokens,
    network,
    fiatSymbol = '$',
    defaultFromSymbol,
    defaultToSymbol,
    defaultSlippage = 50,
}) => {
    const mappedTokens = useMemo(() => mapSwapWidgetTokens(tokens), [tokens]);

    const [fromToken, setFromToken] = useState<SwapWidgetToken | null>(
        mappedTokens.find((t) => t.symbol === defaultFromSymbol) ?? mappedTokens[0] ?? null,
    );
    const [toToken, setToToken] = useState<SwapWidgetToken | null>(
        mappedTokens.find((t) => t.symbol === defaultToSymbol) ?? mappedTokens[1] ?? null,
    );
    const [fromAmount, setFromAmountRaw] = useState('');
    const handleSetFromAmount = useCallback(
        (value: string) => {
            if (value === '' || validateNumericString(value, fromToken?.decimals)) {
                setFromAmountRaw(value);
            }
        },
        [fromToken?.decimals],
    );
    const [isFlipped, setIsFlipped] = useState(false);
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

    const fromFiatValue = useMemo(() => {
        const fromNum = parseFloat(fromAmount) || 0;

        if (!fromToken?.rate || fromNum <= 0) return null;

        return (fromNum * fromToken.rate).toFixed(2);
    }, [fromAmount, fromToken]);

    const toFiatValue = useMemo(() => {
        const toNum = parseFloat(toAmount) || 0;

        if (!toToken?.rate || toNum <= 0) return null;

        return (toNum * toToken.rate).toFixed(2);
    }, [toAmount, toToken]);

    const handleSetFromToken = useCallback(
        (token: SwapWidgetToken) => {
            if (toToken && token.address === toToken.address) {
                setToToken(fromToken);
            }
            setFromToken(token);
            setFromAmountRaw((prev) => truncateDecimals(prev, token.decimals));
        },
        [fromToken, toToken],
    );

    const handleSetToToken = useCallback(
        (token: SwapWidgetToken) => {
            if (fromToken && token.address === fromToken.address) {
                setFromToken(toToken);
            }
            setToToken(token);
        },
        [fromToken, toToken],
    );

    const handleFlip = useCallback(() => {
        setIsFlipped((prev) => !prev);
        setFromToken(toToken);
        setToToken(fromToken);
        if (toToken) {
            setFromAmountRaw((prev) => truncateDecimals(prev, toToken.decimals));
        }
    }, [fromToken, toToken]);

    const [wallet] = useSelectedWallet();
    const isWalletConnected = wallet !== null;
    const address = useAddress();

    const isFromNative = fromToken?.address === 'native';
    const isToNative = toToken?.address === 'native';

    const { data: tonBalance } = useBalance();

    const { data: fromJettonBalance } = useJettonBalanceByAddress({
        jettonAddress: fromToken?.address,
        ownerAddress: address ?? undefined,
        jettonDecimals: fromToken?.decimals,
        query: { enabled: !isFromNative && !!fromToken },
    });

    const { data: toJettonBalance } = useJettonBalanceByAddress({
        jettonAddress: toToken?.address,
        ownerAddress: address ?? undefined,
        jettonDecimals: toToken?.decimals,
        query: { enabled: !isToNative && !!toToken },
    });

    const fromBalance = isFromNative ? tonBalance : fromJettonBalance;
    const toBalance = isToNative ? tonBalance : toJettonBalance;

    const handleMaxClick = useCallback(() => {
        if (fromBalance) {
            setFromAmountRaw(fromBalance.replace(/\s/g, ''));
        }
    }, [fromBalance]);

    const { mutateAsync: buildTransaction } = useBuildSwapTransaction();
    const { mutateAsync: sendTransaction, isPending: isSendingTransaction } = useSendTransaction();

    const sendSwapTransaction = useCallback(async () => {
        if (!quote || !address) return;

        const transactionParams = await buildTransaction({ quote, userAddress: address });

        await sendTransaction(transactionParams);
    }, [quote, address, buildTransaction, sendTransaction]);

    const error: SwapError = useMemo(() => {
        const amount = parseFloat(fromAmount) || 0;
        if (amount <= 0) return null;

        const fraction = fromAmount.split('.')[1];
        if (fraction && fromToken && fraction.length > fromToken.decimals) {
            return 'tooManyDecimals';
        }

        if (fromBalance !== undefined && amount > parseFloat(fromBalance)) {
            return 'insufficientBalance';
        }

        if (quoteError && fromAmountDebounced) {
            return 'quoteError';
        }

        return null;
    }, [fromAmount, fromToken, fromBalance, quoteError, fromAmountDebounced]);

    const canSubmit = (parseFloat(fromAmount) || 0) > 0 && fromToken !== null && toToken !== null && error === null;

    const value = useMemo(
        () => ({
            tokens: mappedTokens,
            fromToken,
            toToken,
            fromAmount,
            toAmount,
            fiatSymbol,
            fromFiatValue,
            toFiatValue,
            fromBalance,
            toBalance,
            isFlipped,
            canSubmit,
            isWalletConnected,
            quote,
            isQuoteLoading,
            error,
            slippage,
            setFromToken: handleSetFromToken,
            setToToken: handleSetToToken,
            setFromAmount: handleSetFromAmount,
            setSlippage,
            onFlip: handleFlip,
            onMaxClick: handleMaxClick,
            sendSwapTransaction,
            isSendingTransaction,
        }),
        [
            mappedTokens,
            fromToken,
            toToken,
            fromAmount,
            toAmount,
            fiatSymbol,
            fromFiatValue,
            toFiatValue,
            fromBalance,
            toBalance,
            isFlipped,
            canSubmit,
            isWalletConnected,
            quote,
            isQuoteLoading,
            error,
            slippage,
            handleSetFromToken,
            handleSetToToken,
            handleSetFromAmount,
            handleFlip,
            handleMaxClick,
            sendSwapTransaction,
            isSendingTransaction,
        ],
    );

    return <SwapContext.Provider value={value}>{children}</SwapContext.Provider>;
};
