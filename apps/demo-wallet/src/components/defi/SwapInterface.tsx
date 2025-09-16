import React, { useState, useCallback, useEffect } from 'react';

import { Button, Card, Input } from '../';
import type { Action, DeFiEndpoint, SwapFormData, SwapQuote, TokenRef, QuoteResult } from '../../types';
import { useWallet } from '../../stores';
import { createComponentLogger } from '../../utils/logger';

const log = createComponentLogger('SwapInterface');

interface SwapInterfaceProps {
    endpoint: DeFiEndpoint;
    action: Action;
    onBack: () => void;
    onSwapExecute: (swapQuote: SwapQuote) => Promise<void>;
}

// Common TON tokens - in a real app, this would come from an API
const COMMON_TOKENS: TokenRef[] = [
    {
        standard: 'ton',
        address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
        decimals: 9,
        symbol: 'TON',
    },
    {
        standard: 'jetton',
        address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', // Example USDT
        decimals: 6,
        symbol: 'USDT',
    },
    {
        standard: 'jetton',
        address: 'EQBYNBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA', // Example jUSDC
        decimals: 6,
        symbol: 'jUSDC',
    },
];

export const SwapInterface: React.FC<SwapInterfaceProps> = ({ endpoint, action, onBack, onSwapExecute }) => {
    const { address } = useWallet();

    const [formData, setFormData] = useState<SwapFormData>({
        tokenIn: COMMON_TOKENS[0], // Default to TON
        tokenOut: COMMON_TOKENS[1], // Default to USDT
        amountIn: '',
        slippageBps: '50', // 0.5% default slippage
        useGasless: false,
        excessAddress: '',
    });

    const [quoteResult, setQuoteResult] = useState<QuoteResult>({
        quote: null,
        loading: false,
    });

    const [customTokenIn, setCustomTokenIn] = useState('');
    const [customTokenOut, setCustomTokenOut] = useState('');
    const [showCustomTokenIn, setShowCustomTokenIn] = useState(false);
    const [showCustomTokenOut, setShowCustomTokenOut] = useState(false);

    const updateFormData = (updates: Partial<SwapFormData>) => {
        setFormData((prev) => ({ ...prev, ...updates }));
        // Reset quote when form changes
        setQuoteResult({ quote: null, loading: false });
    };

    const parseCustomToken = (input: string): TokenRef | null => {
        try {
            // Expected format: standard:address:decimals:symbol
            // Example: jetton:EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs:6:USDT
            const parts = input.split(':');
            if (parts.length !== 4) return null;

            const [standard, address, decimals, symbol] = parts;
            if (standard !== 'ton' && standard !== 'jetton') return null;

            return {
                standard: standard as 'ton' | 'jetton',
                address,
                decimals: parseInt(decimals, 10),
                symbol,
            };
        } catch {
            return null;
        }
    };

    const handleCustomTokenSubmit = (isTokenIn: boolean, input: string) => {
        const token = parseCustomToken(input);
        if (token) {
            if (isTokenIn) {
                updateFormData({ tokenIn: token });
                setShowCustomTokenIn(false);
                setCustomTokenIn('');
            } else {
                updateFormData({ tokenOut: token });
                setShowCustomTokenOut(false);
                setCustomTokenOut('');
            }
        }
    };

    const handleGetQuote = useCallback(async () => {
        if (!formData.tokenIn || !formData.tokenOut || !formData.amountIn || !address) {
            return;
        }

        setQuoteResult({ quote: null, loading: true });

        try {
            const swapInput = {
                amount_in: formData.amountIn,
                token_in: formData.tokenIn,
                token_out: formData.tokenOut,
                wallet_address: address,
                slippage_bps: formData.slippageBps,
                chain_id: endpoint.meta?.chain_id || 1,
                use_gasless: formData.useGasless,
                excess_address: formData.excessAddress || undefined,
                client: {
                    name: 'Demo Wallet',
                    version: '1.0.0',
                },
            };

            const response = await fetch(`${endpoint.url}/api/ton/actions/${action.id}/quote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(swapInput),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const quote = await response.json();
            setQuoteResult({ quote, loading: false });
        } catch (error) {
            log.error('Failed to get quote:', error);
            setQuoteResult({
                quote: null,
                loading: false,
                error: error instanceof Error ? error.message : 'Failed to get quote',
            });
        }
    }, [formData, address, endpoint.url, endpoint.meta?.chain_id, action.id]);

    const handleExecuteSwap = useCallback(async () => {
        if (!quoteResult.quote) return;

        try {
            await onSwapExecute(quoteResult.quote);
        } catch (error) {
            log.error('Failed to execute swap:', error);
        }
    }, [quoteResult.quote, onSwapExecute]);

    const formatAmount = (amount: string, decimals: number): string => {
        if (!amount) return '0';
        const value = parseFloat(amount) / Math.pow(10, decimals);
        return value.toFixed(Math.min(decimals, 6));
    };

    const swapTokens = () => {
        const temp = formData.tokenIn;
        updateFormData({ tokenIn: formData.tokenOut, tokenOut: temp });
    };

    // Auto-quote when form is complete
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (formData.tokenIn && formData.tokenOut && formData.amountIn && address) {
                handleGetQuote();
            }
        }, 1000); // Debounce for 1 second

        return () => clearTimeout(timeoutId);
    }, [formData, address, handleGetQuote]);

    return (
        <Card
            title={
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={onBack}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Back to actions"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>
                        <div>
                            <h2 className="text-lg font-medium text-gray-900">{action.title}</h2>
                            <p className="text-sm text-gray-500">{endpoint.name}</p>
                        </div>
                    </div>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Token Selection */}
                <div className="space-y-4">
                    {/* Token In */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">From Token</label>
                        {!showCustomTokenIn ? (
                            <div className="space-y-2">
                                <select
                                    value={
                                        formData.tokenIn
                                            ? `${formData.tokenIn.standard}:${formData.tokenIn.address}`
                                            : ''
                                    }
                                    onChange={(e) => {
                                        if (e.target.value === 'custom') {
                                            setShowCustomTokenIn(true);
                                        } else {
                                            const token = COMMON_TOKENS.find(
                                                (t) => `${t.standard}:${t.address}` === e.target.value,
                                            );
                                            if (token) updateFormData({ tokenIn: token });
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                                >
                                    {COMMON_TOKENS.map((token) => (
                                        <option
                                            key={`${token.standard}:${token.address}`}
                                            value={`${token.standard}:${token.address}`}
                                        >
                                            {token.symbol} ({token.standard})
                                        </option>
                                    ))}
                                    <option value="custom">Custom Token...</option>
                                </select>
                                {formData.tokenIn && (
                                    <div className="text-xs text-gray-500 font-mono">{formData.tokenIn.address}</div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Input
                                    value={customTokenIn}
                                    onChange={(e) => setCustomTokenIn(e.target.value)}
                                    placeholder="standard:address:decimals:symbol (e.g., jetton:EQC...sDs:6:USDT)"
                                    className="font-mono text-sm"
                                />
                                <div className="flex space-x-2">
                                    <Button
                                        size="sm"
                                        onClick={() => handleCustomTokenSubmit(true, customTokenIn)}
                                        disabled={!parseCustomToken(customTokenIn)}
                                    >
                                        Add Token
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => {
                                            setShowCustomTokenIn(false);
                                            setCustomTokenIn('');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Swap Button */}
                    <div className="flex justify-center">
                        <button
                            onClick={swapTokens}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Swap tokens"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Token Out */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">To Token</label>
                        {!showCustomTokenOut ? (
                            <div className="space-y-2">
                                <select
                                    value={
                                        formData.tokenOut
                                            ? `${formData.tokenOut.standard}:${formData.tokenOut.address}`
                                            : ''
                                    }
                                    onChange={(e) => {
                                        if (e.target.value === 'custom') {
                                            setShowCustomTokenOut(true);
                                        } else {
                                            const token = COMMON_TOKENS.find(
                                                (t) => `${t.standard}:${t.address}` === e.target.value,
                                            );
                                            if (token) updateFormData({ tokenOut: token });
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                                >
                                    {COMMON_TOKENS.map((token) => (
                                        <option
                                            key={`${token.standard}:${token.address}`}
                                            value={`${token.standard}:${token.address}`}
                                        >
                                            {token.symbol} ({token.standard})
                                        </option>
                                    ))}
                                    <option value="custom">Custom Token...</option>
                                </select>
                                {formData.tokenOut && (
                                    <div className="text-xs text-gray-500 font-mono">{formData.tokenOut.address}</div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Input
                                    value={customTokenOut}
                                    onChange={(e) => setCustomTokenOut(e.target.value)}
                                    placeholder="standard:address:decimals:symbol (e.g., jetton:EQC...sDs:6:USDT)"
                                    className="font-mono text-sm"
                                />
                                <div className="flex space-x-2">
                                    <Button
                                        size="sm"
                                        onClick={() => handleCustomTokenSubmit(false, customTokenOut)}
                                        disabled={!parseCustomToken(customTokenOut)}
                                    >
                                        Add Token
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => {
                                            setShowCustomTokenOut(false);
                                            setCustomTokenOut('');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Amount Input */}
                <div>
                    <label htmlFor="amount-in" className="block text-sm font-medium text-gray-700 mb-2">
                        Amount to Swap
                    </label>
                    <Input
                        id="amount-in"
                        type="number"
                        value={formData.amountIn}
                        onChange={(e) => updateFormData({ amountIn: e.target.value })}
                        placeholder={`Enter amount in smallest units (${formData.tokenIn?.decimals} decimals)`}
                        min="0"
                        step="1"
                    />
                    {formData.tokenIn && formData.amountIn && (
                        <p className="text-xs text-gray-500 mt-1">
                            ≈ {formatAmount(formData.amountIn, formData.tokenIn.decimals)} {formData.tokenIn.symbol}
                        </p>
                    )}
                </div>

                {/* Slippage */}
                <div>
                    <label htmlFor="slippage" className="block text-sm font-medium text-gray-700 mb-2">
                        Slippage Tolerance (basis points)
                    </label>
                    <Input
                        id="slippage"
                        type="number"
                        value={formData.slippageBps}
                        onChange={(e) => updateFormData({ slippageBps: e.target.value })}
                        placeholder="50"
                        min="1"
                        max="10000"
                        step="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {formData.slippageBps ? (parseFloat(formData.slippageBps) / 100).toFixed(2) : 0}% slippage
                        tolerance
                    </p>
                </div>

                {/* Gasless Option */}
                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Use Gasless Transaction</label>
                        <p className="text-xs text-gray-500 mt-1">Protocol sponsors gas fees</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={formData.useGasless}
                            onChange={(e) => updateFormData({ useGasless: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {/* Excess Address - only show when gasless is enabled */}
                {formData.useGasless && (
                    <div>
                        <label htmlFor="excess-address" className="block text-sm font-medium text-gray-700 mb-2">
                            Excess Address (Optional)
                        </label>
                        <Input
                            id="excess-address"
                            value={formData.excessAddress}
                            onChange={(e) => updateFormData({ excessAddress: e.target.value })}
                            placeholder="Address to receive excess TON"
                        />
                    </div>
                )}

                {/* Quote Section */}
                {(quoteResult.loading || quoteResult.quote || quoteResult.error) && (
                    <Card title="Quote" className="bg-gray-50">
                        {quoteResult.loading && (
                            <div className="flex items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <span className="ml-2 text-sm text-gray-600">Getting quote...</span>
                            </div>
                        )}

                        {quoteResult.error && (
                            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{quoteResult.error}</div>
                        )}

                        {quoteResult.quote && (
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Expected Output:</span>
                                    <span className="font-medium">
                                        {formatAmount(quoteResult.quote.expected_out, formData.tokenOut?.decimals || 0)}{' '}
                                        {formData.tokenOut?.symbol}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Minimum Output:</span>
                                    <span>
                                        {formatAmount(quoteResult.quote.min_out, formData.tokenOut?.decimals || 0)}{' '}
                                        {formData.tokenOut?.symbol}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Price Impact:</span>
                                    <span>{(parseFloat(quoteResult.quote.price_impact_bps) / 100).toFixed(2)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Fee:</span>
                                    <span>{formatAmount(quoteResult.quote.fee, 9)} TON</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Gas Cost:</span>
                                    <span>{formatAmount(quoteResult.quote.gas_ton, 9)} TON</span>
                                </div>
                                {quoteResult.quote.warnings.length > 0 && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                        <div className="text-yellow-800">
                                            <div className="font-medium">Warnings:</div>
                                            <ul className="mt-1 list-disc list-inside space-y-1">
                                                {quoteResult.quote.warnings.map((warning, index) => (
                                                    <li key={index} className="text-sm">
                                                        {warning}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                    <Button
                        onClick={handleGetQuote}
                        isLoading={quoteResult.loading}
                        disabled={!formData.tokenIn || !formData.tokenOut || !formData.amountIn || !address}
                        className="w-full"
                    >
                        Get Quote
                    </Button>

                    {quoteResult.quote && quoteResult.quote.ton_connect && (
                        <Button onClick={handleExecuteSwap} className="w-full" variant="primary">
                            Execute Swap
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
};
