/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isValidAddress } from '@ton/walletkit';
import type { Jetton, TONTransferRequest } from '@ton/walletkit';
import { useWallet, useJettons, useWalletKit } from '@demo/core';

import { Layout, Button, Input, Card } from '../components';
import { createComponentLogger } from '../utils/logger';

import { useFormattedJetton } from '@/hooks/useFormattedJetton';

// Create logger for send transaction
const log = createComponentLogger('SendTransaction');

interface SelectedToken {
    type: 'TON' | 'JETTON';
    data?: Jetton;
}

export const SendTransaction: React.FC = () => {
    const walletKit = useWalletKit();
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedToken, setSelectedToken] = useState<SelectedToken>({ type: 'TON' });
    const [showTokenSelector, setShowTokenSelector] = useState(false);

    const navigate = useNavigate();
    const { balance, currentWallet, address } = useWallet();
    // Get current wallet
    const { userJettons, isLoadingJettons, loadUserJettons, formatJettonAmount } = useJettons();

    const selectedJettonInfo = useFormattedJetton(selectedToken?.data);

    // Load jettons on mount
    useEffect(() => {
        loadUserJettons();
    }, []);

    const formatTonAmount = (amount: string): string => {
        const tonAmount = parseFloat(amount || '0') / 1000000000;
        return tonAmount.toFixed(4);
    };

    const getCurrentTokenBalance = (): string => {
        if (selectedToken.type === 'TON') {
            return formatTonAmount(balance || '0');
        } else if (selectedJettonInfo?.balance) {
            return selectedJettonInfo?.balance;
        }

        return '0';
    };

    const getCurrentTokenSymbol = (): string => {
        if (selectedToken.type === 'TON') {
            return 'TON';
        }

        return selectedJettonInfo?.symbol || '';
    };

    const getCurrentTokenName = (): string => {
        if (selectedToken.type === 'TON') {
            return 'TON';
        }

        return selectedJettonInfo?.name || '';
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Validate inputs
            if (!isValidAddress(recipient)) {
                throw new Error('Invalid recipient address');
            }

            const inputAmount = parseFloat(amount);
            if (inputAmount <= 0) {
                throw new Error('Amount must be greater than 0');
            }

            const currentBalance = parseFloat(getCurrentTokenBalance());
            if (inputAmount > currentBalance) {
                throw new Error('Insufficient balance');
            }

            if (!currentWallet) {
                throw new Error('No wallet available');
            }

            if (selectedToken.type === 'TON') {
                // Send TON using new API
                log.info('Sending TON', {
                    amount: inputAmount,
                    recipient,
                });

                const nanoTonAmount = Math.floor(inputAmount * 1000000000).toString();

                const tonTransferParams: TONTransferRequest = {
                    recipientAddress: recipient,
                    transferAmount: nanoTonAmount,
                };
                const result = await currentWallet.createTransferTonTransaction(tonTransferParams);
                // display Preview result.preview in a modal
                if (walletKit) {
                    await walletKit.handleNewTransaction(currentWallet, result);
                }

                log.info('TON transfer completed', {
                    transaction: result,
                });
            } else if (selectedToken.data) {
                const decimals = selectedToken.data.decimalsNumber;

                if (!decimals) {
                    throw new Error('Jetton decimals not found');
                }

                // Send Jetton using new API
                log.info('Sending jetton', {
                    jettonAddress: selectedToken.data.address,
                    amount: inputAmount,
                    recipient,
                });

                // Convert the display amount to the smallest unit based on decimals
                const jettonAmount = Math.floor(inputAmount * Math.pow(10, decimals)).toString();

                // Create jetton transfer transaction
                const jettonTransaction = await currentWallet.createTransferJettonTransaction({
                    recipientAddress: recipient,
                    jettonAddress: selectedToken.data.address,
                    transferAmount: jettonAmount,
                });

                if (walletKit) {
                    await walletKit.handleNewTransaction(currentWallet, jettonTransaction);
                }
            }

            // Navigate back to wallet with success message
            navigate('/wallet', {
                state: { message: `${getCurrentTokenSymbol()} sent successfully!` },
            });
        } catch (err) {
            log.error('Send transaction error:', err);
            setError(err instanceof Error ? err.message : 'Failed to send transaction');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMaxAmount = () => {
        const currentBalance = parseFloat(getCurrentTokenBalance());
        if (selectedToken.type === 'TON') {
            // Leave some for fees when sending TON
            const maxAmount = currentBalance - 0.01;
            if (maxAmount > 0) {
                setAmount(maxAmount.toString());
            }
        } else {
            // For jettons, use full balance (TON fees will be deducted separately)
            if (currentBalance > 0) {
                setAmount(currentBalance.toString());
            }
        }
    };

    const handleSendToSelf = () => {
        if (address) {
            setRecipient(address);
        }
    };

    return (
        <Layout title={`Send ${getCurrentTokenSymbol()}`}>
            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Button variant="secondary" size="sm" onClick={() => navigate('/wallet')}>
                        ← Back
                    </Button>
                    <div>
                        <h2 data-testid="request" className="text-xl font-bold text-gray-900">
                            Send {getCurrentTokenName()}
                        </h2>
                    </div>
                </div>

                {/* Token Selector */}
                <Card title="Select Token">
                    <div className="space-y-3">
                        <button
                            onClick={() => setShowTokenSelector(!showTokenSelector)}
                            className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                    {selectedToken.type === 'TON' ? (
                                        <span className="text-sm font-bold text-blue-600">T</span>
                                    ) : selectedJettonInfo?.image ? (
                                        <img
                                            src={selectedJettonInfo.image}
                                            alt={selectedJettonInfo.name || selectedJettonInfo.symbol}
                                            className="w-6 h-6 rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-xs font-bold text-gray-600">
                                            {selectedToken.data?.info?.symbol?.slice(0, 2)}
                                        </span>
                                    )}
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-gray-900">{getCurrentTokenName()}</p>
                                    <p className="text-xs text-gray-500">Balance: {getCurrentTokenBalance()}</p>
                                </div>
                            </div>
                            <svg
                                className={`w-5 h-5 text-gray-400 transition-transform ${
                                    showTokenSelector ? 'rotate-180' : ''
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showTokenSelector && (
                            <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                                {/* TON Option */}
                                <button
                                    onClick={() => {
                                        setSelectedToken({ type: 'TON' });
                                        setShowTokenSelector(false);
                                        setAmount('');
                                    }}
                                    className={`w-full flex items-center justify-between p-3 hover:bg-gray-50 ${
                                        selectedToken.type === 'TON' ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-bold text-blue-600">T</span>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-gray-900">TON</p>
                                            <p className="text-xs text-gray-500">The Open Network</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">
                                            {formatTonAmount(balance || '0')}
                                        </p>
                                        <p className="text-xs text-gray-500">TON</p>
                                    </div>
                                </button>

                                {/* Jetton Options */}
                                {userJettons.map((jetton) => (
                                    <button
                                        key={jetton.address}
                                        onClick={() => {
                                            setSelectedToken({ type: 'JETTON', data: jetton });
                                            setShowTokenSelector(false);
                                            setAmount('');
                                        }}
                                        className={`w-full flex items-center justify-between p-3 hover:bg-gray-50 ${
                                            selectedToken.type === 'JETTON' &&
                                            selectedToken.data?.address === jetton.address
                                                ? 'bg-blue-50'
                                                : ''
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                {jetton?.info?.image ? (
                                                    <img
                                                        src={
                                                            jetton.info.image.url ||
                                                            jetton.info.image.data ||
                                                            jetton.info.image.mediumUrl ||
                                                            jetton.info.image.largeUrl ||
                                                            jetton.info.image.smallUrl ||
                                                            ''
                                                        }
                                                        alt={jetton.info?.name}
                                                        className="w-6 h-6 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-xs font-bold text-gray-600">
                                                        {jetton.info?.symbol?.slice(0, 2)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {jetton.info?.name || jetton.info?.symbol}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {jetton.info?.symbol}
                                                    {/*{jetton.verification?.verified && (*/}
                                                    {/*    <span className="ml-1 text-green-600">✓</span>*/}
                                                    {/*)}*/}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900">
                                                {formatJettonAmount(jetton.balance || '0', jetton.decimalsNumber || 9)}
                                            </p>
                                            <p className="text-xs text-gray-500">{jetton?.info?.symbol}</p>
                                        </div>
                                    </button>
                                ))}

                                {userJettons.length === 0 && !isLoadingJettons && (
                                    <div className="p-4 text-center text-gray-500 text-sm">No jettons found</div>
                                )}

                                {isLoadingJettons && (
                                    <div className="p-4 text-center text-gray-500 text-sm">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                        Loading tokens...
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Balance Display */}
                <Card>
                    <div className="text-center">
                        <p className="text-sm text-gray-500">Available Balance</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {getCurrentTokenBalance()} {getCurrentTokenSymbol()}
                        </p>
                    </div>
                </Card>

                {/* Send Form */}
                <Card>
                    <form onSubmit={handleSend} className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-gray-700">Recipient Address</label>
                                {address && (
                                    <button
                                        type="button"
                                        onClick={handleSendToSelf}
                                        className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer"
                                        data-testid="use-my-address"
                                    >
                                        Use my address
                                    </button>
                                )}
                            </div>
                            <Input
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                placeholder="EQxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                required
                                helperText="Enter the recipient's TON address"
                                data-testid="recipient-input"
                            />
                        </div>

                        <div>
                            <Input
                                type="number"
                                step={selectedToken.type === 'TON' ? '0.000000001' : '0.000000001'}
                                min="0"
                                label={`Amount (${getCurrentTokenSymbol()})`}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.0000"
                                required
                                data-testid="amount-input"
                                helperText={
                                    selectedToken.type === 'TON'
                                        ? 'Minimum transaction: 0.0001 TON'
                                        : `Enter amount in ${getCurrentTokenSymbol()} units`
                                }
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

                        {/* Transaction Preview */}
                        {recipient && amount && (
                            <div className="bg-gray-50 rounded-md p-4 space-y-2">
                                <h4 className="font-medium text-gray-900">Transaction Summary</h4>
                                <div className="text-sm space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">To:</span>
                                        <span className="font-mono">
                                            {recipient.slice(0, 6)}...{recipient.slice(-6)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Amount:</span>
                                        <span>
                                            {amount} {getCurrentTokenSymbol()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">
                                            {selectedToken.type === 'TON' ? 'Network Fee:' : 'Jetton Fee:'}
                                        </span>
                                        <span>~0.01 TON</span>
                                    </div>
                                    {selectedToken.type === 'JETTON' && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Forward Fee:</span>
                                            <span>~0.01 TON</span>
                                        </div>
                                    )}
                                    <hr className="my-2" />
                                    <div className="flex justify-between font-medium">
                                        <span>You'll send:</span>
                                        <span>
                                            {amount} {getCurrentTokenSymbol()}
                                        </span>
                                    </div>
                                    {selectedToken.type === 'JETTON' && (
                                        <div className="flex justify-between font-medium">
                                            <span>TON fee deducted:</span>
                                            <span>~0.02 TON</span>
                                        </div>
                                    )}
                                    {selectedToken.type === 'TON' && (
                                        <div className="flex justify-between font-medium">
                                            <span>Total deducted:</span>
                                            <span>{(parseFloat(amount) + 0.01).toFixed(4)} TON</span>
                                        </div>
                                    )}
                                </div>

                                {selectedToken.type === 'JETTON' && (
                                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                                        <p className="font-medium">Note about Jetton transfers:</p>
                                        <p>
                                            Jetton transfers require TON for transaction fees. Make sure you have enough
                                            TON balance for the fees.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {error && <div className="text-red-600 text-sm text-center">{error}</div>}

                        <Button
                            type="submit"
                            isLoading={isLoading}
                            disabled={!recipient || !amount || parseFloat(amount) <= 0}
                            className="w-full"
                            data-testid="send-submit"
                        >
                            {isLoading ? `Sending ${getCurrentTokenSymbol()}...` : `Send ${getCurrentTokenSymbol()}`}
                        </Button>
                    </form>
                </Card>

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
                                Double-check the recipient address. Blockchain transactions are irreversible.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
