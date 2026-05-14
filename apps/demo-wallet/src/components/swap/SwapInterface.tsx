/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useSwap, useAuth, useJettons } from '@demo/wallet-core';
import { useNavigate } from 'react-router-dom';

import { SwapSettings } from './SwapSettings';
import { TokenInput } from './TokenInput';
import { QuoteTimer } from './QuoteTimer';
import { Button } from '../Button';
import { Card } from '../Card';
import { HoldToSignButton } from '../HoldToSignButton';

import { cn } from '@/lib/utils';
import { resolveTokenSymbol } from '@/utils/swapToken';

const QUOTE_DEBOUNCE_MS = 500;
const QUOTE_REFRESH_LEAD_MS = 5000;

function getPriceImpactColor(priceImpact: number): string {
    if (priceImpact > 500) return 'text-destructive';
    if (priceImpact > 200) return 'text-yellow-600';
    return 'text-green-600';
}

interface SwapInterfaceProps {
    className?: string;
}

export const SwapInterface: FC<SwapInterfaceProps> = ({ className }) => {
    const {
        fromToken,
        toToken,
        amount,
        isReverseSwap,
        destinationAddress,
        currentQuote,
        isLoadingQuote,
        isSwapping,
        error,
        slippageBps,
        setFromToken,
        setToToken,
        setSwapAmount: setAmount,
        setIsReverseSwap,
        setDestinationAddress,
        setSlippageBps,
        swapTokens,
        getSwapQuote: getQuote,
        executeSwap,
        validateSwapInputs,
    } = useSwap();

    const { holdToSign } = useAuth();
    const { userJettons } = useJettons();
    const navigate = useNavigate();

    const [showSlippageSettings, setShowSlippageSettings] = useState(false);
    const [useCustomDestination, setUseCustomDestination] = useState(false);
    const [isRefreshingQuote, setIsRefreshingQuote] = useState(false);

    const fromSymbol = resolveTokenSymbol(fromToken, userJettons);
    const toSymbol = resolveTokenSymbol(toToken, userJettons);

    // Debounced auto-quote: refetch the quote whenever the meaningful inputs change.
    // We deliberately re-run on quote becoming null (e.g. after a token switch)
    // so the new pair fetches a quote without requiring an extra keystroke.
    useEffect(() => {
        if (!amount || parseFloat(amount) <= 0) return;
        if (validateSwapInputs()) return;
        if (currentQuote) return;

        const handle = setTimeout(() => {
            void getQuote();
        }, QUOTE_DEBOUNCE_MS);

        return () => clearTimeout(handle);
    }, [
        amount,
        fromToken.address,
        toToken.address,
        isReverseSwap,
        slippageBps,
        currentQuote,
        validateSwapInputs,
        getQuote,
    ]);

    // Silent refresh: re-fetch the quote ~5s before it expires so the
    // hold-to-sign gesture always has a fresh quote available.
    useEffect(() => {
        if (!currentQuote?.expiresAt) return;

        const expiresAtMs = currentQuote.expiresAt * 1000;
        const refreshAt = expiresAtMs - QUOTE_REFRESH_LEAD_MS;
        const delay = Math.max(0, refreshAt - Date.now());

        const handle = setTimeout(async () => {
            setIsRefreshingQuote(true);
            try {
                await getQuote();
            } finally {
                setIsRefreshingQuote(false);
            }
        }, delay);

        return () => clearTimeout(handle);
    }, [currentQuote?.expiresAt, getQuote]);

    // Guard against double-firing executeSwap on accidental re-entries (e.g. the
    // hold-to-sign button completing twice). Navigate to /wallet only when the
    // broadcast actually succeeded; on failure the inline error stays put.
    const isExecutingRef = useRef(false);
    const handleExecuteSwap = async () => {
        if (isExecutingRef.current) return;
        isExecutingRef.current = true;
        try {
            const hash = await executeSwap();
            if (hash) {
                navigate('/wallet');
            }
        } finally {
            isExecutingRef.current = false;
        }
    };

    const handleFromAmountChange = (val: string) => {
        setAmount(val);
        setIsReverseSwap(false);
    };

    const handleToAmountChange = (val: string) => {
        setAmount(val);
        setIsReverseSwap(true);
    };

    const fromAmount = !isReverseSwap ? amount : currentQuote ? currentQuote.fromAmount : '';
    const toAmount = isReverseSwap ? amount : currentQuote ? currentQuote.toAmount : '';

    const hasFromAmount = !!fromAmount && parseFloat(fromAmount) > 0;
    const hasToAmount = !!toAmount && parseFloat(toAmount) > 0;
    const hasInput = hasFromAmount || hasToAmount;

    const validationError = validateSwapInputs();
    const isQuoteReady = !!currentQuote && !error;
    const canSwap = isQuoteReady && !isSwapping && !validationError;

    const idleCtaLabel = (() => {
        if (!fromToken || !toToken) return 'Select tokens';
        if (!hasInput) return 'Enter an amount';
        if (validationError && validationError !== 'Please enter an amount') return validationError;
        if (isLoadingQuote) return 'Getting best quote…';
        if (error) return 'Try again';
        return null;
    })();

    return (
        <Card className={cn('mx-auto w-full max-w-md', className)}>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Swap</h2>
                <SwapSettings
                    slippageBps={slippageBps}
                    setSlippageBps={setSlippageBps}
                    showSettings={showSlippageSettings}
                    setShowSettings={setShowSlippageSettings}
                />
            </div>

            <div className="space-y-4">
                <TokenInput
                    amount={fromAmount}
                    excludeToken={toToken}
                    label="From"
                    onAmountChange={handleFromAmountChange}
                    onTokenSelect={setFromToken}
                    token={fromToken}
                    isLoading={isReverseSwap && isLoadingQuote}
                />

                <div className="w-full h-1 relative -mt-2">
                    <button
                        onClick={swapTokens}
                        className="p-1 bg-blue-500 hover:bg-blue-600 border-4 border-white rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                            />
                        </svg>
                    </button>
                </div>

                <TokenInput
                    amount={toAmount}
                    excludeToken={fromToken}
                    label="To"
                    onAmountChange={handleToAmountChange}
                    onTokenSelect={setToToken}
                    token={toToken}
                    className="-mt-2"
                    isLoading={!isReverseSwap && isLoadingQuote}
                />

                {/* Destination Address */}
                <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={useCustomDestination}
                            onChange={(e) => {
                                setUseCustomDestination(e.target.checked);
                                if (!e.target.checked) {
                                    setDestinationAddress('');
                                }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 bg-white rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Use different recipient address</span>
                    </label>

                    {useCustomDestination && (
                        <div className="space-y-1">
                            <input
                                type="text"
                                value={destinationAddress}
                                onChange={(e) => setDestinationAddress(e.target.value)}
                                placeholder="Enter recipient address (EQ...)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <p className="text-xs text-gray-500">
                                Swapped tokens will be sent to this address instead of your wallet
                            </p>
                        </div>
                    )}
                </div>

                {currentQuote && (
                    <>
                        <div className="border-t border-gray-200 my-6" />

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Provider</span>
                                <span className="font-medium capitalize">{currentQuote.providerId}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Minimum Received</span>
                                <span className="font-medium">
                                    {Number(currentQuote.minReceived).toFixed(6)} {toSymbol}
                                </span>
                            </div>

                            {currentQuote.priceImpact !== undefined && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Price Impact</span>
                                    <span className={cn(getPriceImpactColor(currentQuote.priceImpact))}>
                                        {(currentQuote.priceImpact / 100).toFixed(2)}%
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Slippage</span>
                                <span className="font-medium">{slippageBps / 100}%</span>
                            </div>

                            <div className="flex justify-between pt-1">
                                <span className="text-muted-foreground text-xs">Quote</span>
                                <QuoteTimer
                                    expiresAt={currentQuote.expiresAt}
                                    isRefreshing={isRefreshingQuote || isLoadingQuote}
                                />
                            </div>
                        </div>
                    </>
                )}

                {error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-center text-red-600 text-sm">
                        {error}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-3 mt-6">
                {idleCtaLabel ? (
                    <Button disabled isLoading={isLoadingQuote} className="w-full">
                        {idleCtaLabel}
                    </Button>
                ) : holdToSign ? (
                    <HoldToSignButton
                        onComplete={handleExecuteSwap}
                        isLoading={isSwapping}
                        disabled={!canSwap}
                        idleLabel={`Hold to swap ${fromSymbol} for ${toSymbol}`}
                    />
                ) : (
                    <Button onClick={handleExecuteSwap} isLoading={isSwapping} disabled={!canSwap} className="w-full">
                        Swap {fromSymbol} for {toSymbol}
                    </Button>
                )}
            </div>
        </Card>
    );
};
