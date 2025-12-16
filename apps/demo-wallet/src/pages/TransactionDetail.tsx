/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Base64Normalize, Network } from '@ton/walletkit';
import type { TransactionMessage } from '@ton/walletkit';
import { useWalletKit, useWalletStore } from '@ton/demo-core';

interface TransactionDetailData {
    hash: string;
    timestamp: number;
    type: 'send' | 'receive';
    amount: string;
    address: string;
    status: 'pending' | 'confirmed' | 'failed';
    totalFees: string;
    logicalTime: string;
    account: string;
    description: unknown;
    inMessage?: TransactionMessage;
    outMessages?: TransactionMessage[];
}

export const TransactionDetail: React.FC = () => {
    const walletKit = useWalletKit();
    const savedWallets = useWalletStore((state) => state.walletManagement.savedWallets);
    const activeWalletId = useWalletStore((state) => state.walletManagement.activeWalletId);
    const { hash } = useParams<{ hash: string }>();
    const navigate = useNavigate();
    const [transaction, setTransaction] = useState<TransactionDetailData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get the active wallet's network
    const activeWallet = savedWallets.find((w) => w.id === activeWalletId);
    const walletNetwork = activeWallet?.network || 'testnet';
    const chainNetwork = walletNetwork === 'mainnet' ? Network.mainnet() : Network.testnet();

    const formatTonAmount = (amount: string): string => {
        const tonAmount = parseFloat(amount || '0') / 1000000000;
        return tonAmount.toFixed(9);
    };

    const formatAddress = (addr: string): string => {
        if (!addr) return '';
        return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
    };

    const formatTimestamp = (timestamp: number): string => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (_err) {
            // Silently fail - clipboard functionality is optional
        }
    };

    useEffect(() => {
        const fetchTransactionDetail = async () => {
            if (!hash) {
                setError('Transaction hash not provided');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                if (!walletKit) {
                    setError('WalletKit not initialized');
                    setIsLoading(false);
                    return;
                }

                while (!walletKit?.isReady()) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }

                // Use the walletKit's API client to get transaction by hash
                const apiClient = walletKit.getApiClient(chainNetwork);
                const base64Hash = Base64Normalize(hash);
                const response = await apiClient.getTransactionsByHash({ msgHash: base64Hash });

                if (!response.transactions || response.transactions.length === 0) {
                    setError('Transaction not found');
                    setIsLoading(false);
                    return;
                }

                const tx = response.transactions[0];

                // Transform the transaction data
                let type: 'send' | 'receive' = 'receive';
                let amount = '0';
                let address = '';

                // Check incoming message
                if (tx.inMessage && tx.inMessage.value) {
                    amount = tx.inMessage.value;
                    address = tx.inMessage.source || '';
                    type = 'receive';
                }

                // Check outgoing messages - if there are any, it's likely a send transaction
                if (tx.outMessages && tx.outMessages.length > 0) {
                    const mainOutMsg = tx.outMessages[0];
                    if (mainOutMsg.value) {
                        amount = mainOutMsg.value;
                        address = mainOutMsg.destination || '';
                        type = 'send';
                    }
                }

                // Determine status
                let status: 'pending' | 'confirmed' | 'failed' = 'confirmed';
                if (tx.description?.isAborted) {
                    status = 'failed';
                } else if (!tx.description?.computePhase?.isSuccess) {
                    status = 'failed';
                }

                const detailData: TransactionDetailData = {
                    hash: tx.hash,
                    timestamp: tx.now,
                    type,
                    amount,
                    address,
                    status,
                    totalFees: tx.totalFees || '0',
                    logicalTime: tx.logicalTime,
                    account: tx.account,
                    description: tx.description,
                    inMessage: tx.inMessage,
                    outMessages: tx.outMessages,
                };

                setTransaction(detailData);
            } catch (_err) {
                setError('Failed to load transaction details');
            } finally {
                setIsLoading(false);
            }
        };

        void fetchTransactionDetail();
    }, [hash, chainNetwork]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading transaction details...</p>
                </div>
            </div>
        );
    }

    if (error || !transaction) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-400 mb-4">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <p className="text-red-600 mb-4">{error || 'Transaction not found'}</p>
                    <button
                        onClick={() => navigate('/wallet')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                        Back to Wallet
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto p-6">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/wallet')}
                        className="flex items-center text-blue-500 hover:text-blue-600 mb-4"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Wallet
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Transaction Details</h1>
                </div>

                {/* Transaction Overview */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                        transaction.type === 'send' ? 'bg-red-100' : 'bg-green-100'
                                    }`}
                                >
                                    {transaction.type === 'send' ? (
                                        <svg
                                            className="w-6 h-6 text-red-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 11l5-5m0 0l5 5m-5-5v12"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            className="w-6 h-6 text-green-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M17 13l-5 5m0 0l-5-5m5 5V6"
                                            />
                                        </svg>
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        {transaction.type === 'send' ? 'Sent' : 'Received'}
                                    </h2>
                                    <p className="text-gray-500">{formatTimestamp(transaction.timestamp)}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p
                                    className={`text-2xl font-bold ${
                                        transaction.type === 'send' ? 'text-red-600' : 'text-green-600'
                                    }`}
                                >
                                    {transaction.type === 'send' ? '-' : '+'}
                                    {formatTonAmount(transaction.amount)} TON
                                </p>
                                <p
                                    className={`text-sm font-medium ${
                                        transaction.status === 'confirmed'
                                            ? 'text-green-500'
                                            : transaction.status === 'failed'
                                              ? 'text-red-500'
                                              : 'text-yellow-500'
                                    }`}
                                >
                                    {transaction.status.toUpperCase()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transaction Details */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Transaction Information</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {/* Hash */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500">Transaction Hash</span>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-900 font-mono">
                                    {formatAddress(transaction.hash)}
                                </span>
                                <button
                                    onClick={() => copyToClipboard(transaction.hash)}
                                    className="p-1 text-gray-400 hover:text-gray-600"
                                    title="Copy hash"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500">
                                {transaction.type === 'send' ? 'To' : 'From'}
                            </span>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-900 font-mono">
                                    {formatAddress(transaction.address)}
                                </span>
                                <button
                                    onClick={() => copyToClipboard(transaction.address)}
                                    className="p-1 text-gray-400 hover:text-gray-600"
                                    title="Copy address"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Fees */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500">Transaction Fees</span>
                            <span className="text-sm text-gray-900">{formatTonAmount(transaction.totalFees)} TON</span>
                        </div>

                        {/* Logical Time */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500">Logical Time</span>
                            <span className="text-sm text-gray-900 font-mono">{transaction.logicalTime}</span>
                        </div>

                        {/* Account */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500">Account</span>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-900 font-mono">
                                    {formatAddress(transaction.account)}
                                </span>
                                <button
                                    onClick={() => copyToClipboard(transaction.account)}
                                    className="p-1 text-gray-400 hover:text-gray-600"
                                    title="Copy account"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                {(transaction.inMessage || (transaction.outMessages && transaction.outMessages.length > 0)) && (
                    <div className="bg-white rounded-lg shadow-md border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Messages</h3>
                        </div>
                        <div className="p-6">
                            {/* Incoming Message */}
                            {transaction.inMessage && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Incoming Message</h4>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-500">From:</span>
                                            <span className="text-sm font-mono">
                                                {formatAddress(transaction.inMessage.source || '')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-500">To:</span>
                                            <span className="text-sm font-mono">
                                                {formatAddress(transaction.inMessage.destination || '')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-500">Value:</span>
                                            <span className="text-sm">
                                                {formatTonAmount(transaction.inMessage.value || '0')} TON
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Outgoing Messages */}
                            {transaction.outMessages && transaction.outMessages.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Outgoing Messages</h4>
                                    <div className="space-y-3">
                                        {transaction.outMessages.map((msg, index) => (
                                            <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-500">From:</span>
                                                    <span className="text-sm font-mono">
                                                        {formatAddress(msg.source || '')}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-500">To:</span>
                                                    <span className="text-sm font-mono">
                                                        {formatAddress(msg.destination || '')}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-500">Value:</span>
                                                    <span className="text-sm">
                                                        {formatTonAmount(msg.value || '0')} TON
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
