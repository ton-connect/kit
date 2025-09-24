import React, { useEffect, useState } from 'react';

import { useWallet } from '../stores';

export const RecentTransactions: React.FC = () => {
    const { transactions, loadTransactions, address } = useWallet();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const formatTonAmount = (amount: string): string => {
        const tonAmount = parseFloat(amount || '0') / 1000000000; // Convert nanoTON to TON
        return tonAmount.toFixed(4);
    };

    const formatAddress = (addr: string): string => {
        if (!addr) return '';
        return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
    };

    const formatTimestamp = (timestamp: number): string => {
        return new Date(timestamp).toLocaleString();
    };

    // Load transactions when component mounts or address changes
    useEffect(() => {
        const fetchTransactions = async () => {
            if (!address) return;

            setIsLoading(true);
            setError(null);
            try {
                await loadTransactions(10);
            } catch (_err) {
                setError('Failed to load transactions');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTransactions();
    }, [address, loadTransactions]);

    const handleRefresh = async () => {
        if (!address) return;

        setIsLoading(true);
        setError(null);
        try {
            await loadTransactions(10);
        } catch (_err) {
            setError('Failed to refresh transactions');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
                <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    title="Refresh transactions"
                >
                    <svg
                        className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                </button>
            </div>
            <div className="p-6">
                {error ? (
                    <div className="text-center py-8">
                        <div className="text-red-400 mb-2">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <p className="text-red-500 text-sm">{error}</p>
                        <button onClick={handleRefresh} className="mt-2 text-blue-500 text-sm hover:text-blue-600">
                            Try again
                        </button>
                    </div>
                ) : isLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-gray-500 text-sm">Loading transactions...</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-gray-400 mb-2">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                            </svg>
                        </div>
                        <p className="text-gray-500 text-sm">No transactions yet</p>
                        <p className="text-gray-400 text-xs mt-1">Your transaction history will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.slice(0, 10).map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            tx.type === 'send' ? 'bg-red-100' : 'bg-green-100'
                                        }`}
                                    >
                                        {tx.type === 'send' ? (
                                            <svg
                                                className="w-4 h-4 text-red-600"
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
                                                className="w-4 h-4 text-green-600"
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
                                        <p className="text-sm font-medium text-gray-900">
                                            {tx.type === 'send' ? 'Sent' : 'Received'}
                                        </p>
                                        <p className="text-xs text-gray-500">{formatAddress(tx.address)}</p>
                                        <p className="text-xs text-gray-400">{formatTimestamp(tx.timestamp)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p
                                        className={`text-sm font-medium ${
                                            tx.type === 'send' ? 'text-red-600' : 'text-green-600'
                                        }`}
                                    >
                                        {tx.type === 'send' ? '-' : '+'}
                                        {formatTonAmount(tx.amount)} TON
                                    </p>
                                    <p
                                        className={`text-xs ${
                                            tx.status === 'confirmed'
                                                ? 'text-green-500'
                                                : tx.status === 'failed'
                                                  ? 'text-red-500'
                                                  : 'text-yellow-500'
                                        }`}
                                    >
                                        {tx.status}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
