/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet, useSwap } from '@demo/wallet-core';

import { Layout, Button, Input, Card } from '../components';

// USDT on TON mainnet
const USDT_ADDRESS = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';

export const Swap: React.FC = () => {
    const navigate = useNavigate();
    const { balance } = useWallet();
    const {
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        currentQuote,
        isLoadingQuote,
        isSwapping,
        error,
        slippageBps,
        setFromToken,
        setToToken,
        setFromAmount,
        setSlippageBps,
        swapTokens,
        getQuote,
        executeSwap,
        clearSwap,
    } = useSwap();

    const [showSlippageSettings, setShowSlippageSettings] = useState(false);

    useEffect(() => {
        setFromToken('TON');
        setToToken(USDT_ADDRESS);
        return () => {
            clearSwap();
        };
    }, []);

    const formatTonAmount = (amount: string): string => {
        const tonAmount = parseFloat(amount || '0') / 1000000000;
        return tonAmount.toFixed(4);
    };

    const getTokenSymbol = (tokenAddress: string): string => {
        if (tokenAddress === 'TON') return 'TON';
        if (tokenAddress === USDT_ADDRESS) return 'USDT';
        return 'Unknown';
    };

    const getTokenName = (tokenAddress: string): string => {
        if (tokenAddress === 'TON') return 'Toncoin';
        if (tokenAddress === USDT_ADDRESS) return 'Tether USD';
        return 'Unknown';
    };

    const fromSymbol = getTokenSymbol(fromToken);
    const toSymbol = getTokenSymbol(toToken);

    const handleSwapTokens = () => {
        swapTokens();
    };

    const handleGetQuote = async () => {
        if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
            return;
        }
        await getQuote();
    };

    const handleExecuteSwap = async () => {
        await executeSwap();
        if (!error) {
            navigate('/wallet', {
                state: { message: 'Swap executed successfully!' },
            });
        }
    };

    const handleMaxAmount = () => {
        const currentBalance = parseFloat(formatTonAmount(balance || '0'));
        if (fromToken === 'TON') {
            const maxAmount = currentBalance - 0.1;
            if (maxAmount > 0) {
                setFromAmount(maxAmount.toString());
            }
        }
    };

    const slippageOptions = [50, 100, 300, 500];

    return (
        <Layout title="Swap TON ↔ USDT">
            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Button variant="secondary" size="sm" onClick={() => navigate('/wallet')}>
                        ← Back
                    </Button>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Swap {fromSymbol} → {toSymbol}
                        </h2>
                    </div>
                </div>

                {/* From Token */}
                <Card title="From">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-lg font-bold text-blue-600">
                                        {fromSymbol === 'TON' ? '💎' : '💵'}
                                    </span>
                                </div>
                                <div className="text-left">
                                    <p className="text-base font-semibold text-gray-900">{fromSymbol}</p>
                                    <p className="text-xs text-gray-500">{getTokenName(fromToken)}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Balance</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {fromToken === 'TON' ? formatTonAmount(balance || '0') : '0.00'}
                                </p>
                            </div>
                        </div>

                        <div>
                            <Input
                                type="number"
                                step="0.000000001"
                                min="0"
                                label="Amount"
                                value={fromAmount}
                                onChange={(e) => setFromAmount(e.target.value)}
                                placeholder="0.0000"
                                data-testid="from-amount-input"
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={handleMaxAmount}
                                className="mt-2"
                            >
                                Use Max
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Swap Direction Button */}
                <div className="flex justify-center -my-3">
                    <button
                        onClick={handleSwapTokens}
                        className="p-3 bg-blue-500 hover:bg-blue-600 border-4 border-white rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all z-10"
                    >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                            />
                        </svg>
                    </button>
                </div>

                {/* To Token */}
                <Card title="To">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-lg font-bold text-green-600">
                                        {toSymbol === 'TON' ? '💎' : '💵'}
                                    </span>
                                </div>
                                <div className="text-left">
                                    <p className="text-base font-semibold text-gray-900">{toSymbol}</p>
                                    <p className="text-xs text-gray-500">{getTokenName(toToken)}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Balance</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {toToken === 'TON' ? formatTonAmount(balance || '0') : '0.00'}
                                </p>
                            </div>
                        </div>

                        {toAmount && (
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-2 border-blue-200">
                                <p className="text-sm text-gray-600 mb-1">You will receive</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {toAmount} {toSymbol}
                                </p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Slippage Settings */}
                <Card>
                    <div className="space-y-3">
                        <button
                            onClick={() => setShowSlippageSettings(!showSlippageSettings)}
                            className="w-full flex items-center justify-between"
                        >
                            <span className="text-sm font-medium text-gray-700">Slippage Tolerance</span>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-900">{slippageBps / 100}%</span>
                                <svg
                                    className={`w-4 h-4 text-gray-400 transition-transform ${
                                        showSlippageSettings ? 'rotate-180' : ''
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </div>
                        </button>

                        {showSlippageSettings && (
                            <div className="grid grid-cols-4 gap-2">
                                {slippageOptions.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => setSlippageBps(option)}
                                        className={`p-2 text-sm rounded-lg border ${
                                            slippageBps === option
                                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {option / 100}%
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Quote Information */}
                {currentQuote && (
                    <Card title="Quote Details">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Provider:</span>
                                <span className="font-medium capitalize">{currentQuote.provider}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Minimum Received:</span>
                                <span className="font-medium">
                                    {(parseFloat(currentQuote.minReceived) / Math.pow(10, 6)).toFixed(6)} {toSymbol}
                                </span>
                            </div>
                            {currentQuote.priceImpact && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Price Impact:</span>
                                    <span className="font-medium">{currentQuote.priceImpact.toFixed(2)}%</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-500">Slippage:</span>
                                <span className="font-medium">{slippageBps / 100}%</span>
                            </div>
                        </div>
                    </Card>
                )}

                {error && <div className="text-red-600 text-sm text-center p-3 bg-red-50 rounded-lg">{error}</div>}

                {/* Action Buttons */}
                <div className="space-y-3">
                    <Button
                        onClick={handleGetQuote}
                        isLoading={isLoadingQuote}
                        disabled={
                            !fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0 || isLoadingQuote
                        }
                        className="w-full"
                    >
                        {isLoadingQuote ? 'Getting Quote...' : 'Get Quote'}
                    </Button>

                    {currentQuote && (
                        <Button
                            onClick={handleExecuteSwap}
                            isLoading={isSwapping}
                            disabled={!currentQuote || isSwapping}
                            className="w-full"
                            data-testid="execute-swap"
                        >
                            {isSwapping ? 'Swapping...' : 'Execute Swap'}
                        </Button>
                    )}
                </div>

                {/* Warning */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-800">
                                Always verify the swap details before executing. Quotes may expire and need to be
                                refreshed.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
