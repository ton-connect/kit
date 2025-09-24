import React, { memo, useEffect, useMemo, useState } from 'react';

import { useStore } from '../stores';
import { walletKit } from '../stores/slices/walletSlice';
import type { PreviewTransaction } from '../types/wallet';
import { TraceRow } from './TraceRow';
import { useShallow } from 'zustand/react/shallow';

export const RecentTransactions: React.FC = memo(() => {
    const { transactions, loadTransactions, address } = useStore(
        useShallow((state) => ({    
            transactions: state.wallet.transactions,
            loadTransactions: state.loadTransactions,
            address: state.wallet.address,
        })),
    );
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendingTransactions, setPendingTransactions] = useState<PreviewTransaction[]>([]);

    // Group transactions by external message hash or generate unique trace ID for completed transactions
    const groupTransactionsByTrace = (transactions: PreviewTransaction[]) => {
        const traceGroups = new Map<
            string,
            {
                traceId: string;
                externalHash?: string;
                transactions: PreviewTransaction[];
                timestamp: number;
                isPending?: boolean;
            }
        >();

        transactions.forEach((tx) => {
            let groupKey: string;

            if (tx.status === 'pending' && tx.messageHash) {
                // For pending transactions, use message hash as external hash
                groupKey = `pending_${tx.messageHash}`;
            } else if (tx.externalMessageHash) {
                // For completed transactions, use external message hash
                groupKey = tx.externalMessageHash;
            } else {
                // Fallback: use transaction hash as unique identifier
                groupKey = `tx_${tx.traceId}`;
            }

            // debugger
            if (!traceGroups.has(groupKey)) {
                traceGroups.set(groupKey, {
                    traceId: tx.id,
                    externalHash: tx.messageHash ?? tx.externalMessageHash,
                    transactions: [],
                    timestamp: tx.timestamp,
                    isPending: tx.status === 'pending',
                });
            }

            const group = traceGroups.get(groupKey)!;
            group.transactions.push(tx);
            // Use the earliest timestamp for the group
            group.timestamp = Math.min(group.timestamp, tx.timestamp);
        });

        // Convert to array and sort by timestamp (newest first)
        return Array.from(traceGroups.values()).sort((a, b) => b.timestamp - a.timestamp);
    };

    // Check for pending transactions
    const checkPendingTransactions = async () => {
        if (!address) return;

        try {
            const apiClient = walletKit.getApiClient();
            const pendingResponse = await apiClient.getPendingTransactions({
                accounts: [address],
            });

            if (pendingResponse.transactions && pendingResponse.transactions.length > 0) {
                const pendingTxs: PreviewTransaction[] = pendingResponse.transactions.map((tx) => {
                    // Determine transaction type and amount
                    let type: 'send' | 'receive' = 'receive';
                    let amount = '0';
                    let targetAddress = '';

                    // Check incoming message
                    if (tx.in_msg && tx.in_msg.value) {
                        amount = tx.in_msg.value;
                        targetAddress = tx.in_msg.source || '';
                        type = 'receive';
                    }

                    // Check outgoing messages - if there are any, it's likely a send transaction
                    if (tx.out_msgs && tx.out_msgs.length > 0) {
                        const mainOutMsg = tx.out_msgs[0];
                        if (mainOutMsg.value) {
                            amount = mainOutMsg.value;
                            targetAddress = mainOutMsg.destination;
                            type = 'send';
                        }
                    }

                    return {
                        id: tx.hash,
                        messageHash: tx.in_msg?.hash || '',
                        type,
                        amount,
                        address: targetAddress,
                        timestamp: tx.now * 1000, // Convert to milliseconds
                        status: 'pending' as const,
                    };
                });

                setPendingTransactions(pendingTxs);
            } else {
                setPendingTransactions([]);
            }
        } catch (_err) {
            // Silently handle errors to avoid spamming the user
            // Failed to check pending transactions
            setPendingTransactions([]);
        }
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

    // Set up polling for pending transactions
    useEffect(() => {
        if (!address) return;

        // Start polling immediately
        checkPendingTransactions();

        // Set up interval for polling every 5000ms
        const interval = setInterval(checkPendingTransactions, 5000);

        // Cleanup interval on unmount or address change
        return () => {
            clearInterval(interval);
        };
    }, [address]);

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

    const allTransactions = useMemo(() => {
        return [...pendingTransactions, ...transactions];
    }, [pendingTransactions, transactions]);

    const traceGroups = useMemo(() => {
        return groupTransactionsByTrace(allTransactions);
    }, [allTransactions]);

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
                    {pendingTransactions.length > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {pendingTransactions.length} pending
                        </span>
                    )}
                </div>
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
                        {traceGroups.slice(0, 10).map((group) => (
                            <TraceRow
                                key={group.traceId}
                                traceId={group.traceId}
                                externalHash={group.externalHash}
                                isPending={group.isPending}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});
