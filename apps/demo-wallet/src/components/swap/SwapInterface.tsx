/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { useState } from 'react';
import { useSwap } from '@demo/wallet-core';
import { useNavigate } from 'react-router-dom';
import type { SwapToken } from '@ton/walletkit';

import { SwapSettings } from './SwapSettings';
import { TokenInput } from './TokenInput';
import { QuoteTimer } from './QuoteTimer';
import { Button } from '../Button';
import { Card } from '../Card';

import { cn } from '@/lib/utils';

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
        setAmount,
        setIsReverseSwap,
        setDestinationAddress,
        setSlippageBps,
        swapTokens,
        getQuote,
        executeSwap,
    } = useSwap();

    const navigate = useNavigate();

    const [showSlippageSettings, setShowSlippageSettings] = useState(false);
    const [useCustomDestination, setUseCustomDestination] = useState(false);

    const getTokenSymbol = (token: SwapToken): string => {
        if (token.symbol) return token.symbol;
        if (token.address === 'ton') return 'TON';
        return 'Unknown';
    };

    const fromSymbol = getTokenSymbol(fromToken);
    const toSymbol = getTokenSymbol(toToken);

    const handleGetQuote = async () => {
        await getQuote();
    };

    const handleExecuteSwap = async () => {
        await executeSwap();

        navigate('/wallet', {
            state: { message: `${fromSymbol} sent successfully!` },
        });
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

    const getSwapButtonText = () => {
        if (!fromToken || !toToken) return 'Select tokens';
        const hasFromAmount = fromAmount && parseFloat(fromAmount) > 0;
        const hasToAmount = toAmount && parseFloat(toAmount) > 0;
        if (!hasFromAmount && !hasToAmount) return 'Enter amount';
        if (isLoadingQuote) return 'Getting quote...';
        if (error) return 'Error';
        if (!currentQuote) return 'Get Quote';
        return `Swap ${fromSymbol} for ${toSymbol}`;
    };

    const isSwapDisabled = !!error || isLoadingQuote || isSwapping;

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
                        <QuoteTimer
                            expiresAt={currentQuote.expiresAt}
                            onRefresh={handleGetQuote}
                            isLoading={isLoadingQuote}
                        />

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

                            {currentQuote.priceImpact && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Price Impact</span>
                                    <span className={cn(getPriceImpactColor(currentQuote.priceImpact))}>
                                        {(currentQuote.priceImpact / 100).toFixed(2)}%
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Slippage</span>
                                <span className="font-medium">{slippageBps / 100}%</span>
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
                {!currentQuote && (
                    <Button
                        disabled={isSwapDisabled}
                        onClick={handleGetQuote}
                        isLoading={isLoadingQuote}
                        className="w-full"
                    >
                        {isLoadingQuote ? 'Getting Quote...' : 'Get Quote'}
                    </Button>
                )}

                {currentQuote && (
                    <Button
                        disabled={!currentQuote || isSwapping}
                        onClick={handleExecuteSwap}
                        isLoading={isSwapping}
                        className="w-full"
                    >
                        {isSwapping ? 'Swapping...' : getSwapButtonText()}
                    </Button>
                )}
            </div>
        </Card>
    );
};
