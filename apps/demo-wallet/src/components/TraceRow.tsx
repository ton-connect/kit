import React, { memo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Base64NormalizeUrl } from '@ton/walletkit';
import type { ToncenterTraceItem } from '@ton/walletkit';

import { walletKit } from '../stores/slices/walletSlice';

import { log } from '@/utils/logger';

// Local type definitions for transaction data
interface TransactionMessage {
    hash: string;
    source?: string | null;
    destination: string;
    value?: string | null;
    opcode?: string | null;
}

interface TransactionData {
    hash: string;
    account: string;
    total_fees?: string;
    in_msg?: TransactionMessage | null;
    out_msgs: TransactionMessage[];
    description: {
        aborted?: boolean;
        compute_ph?: {
            success?: boolean;
        };
    };
    emulated?: boolean;
}

interface TraceRowProps {
    traceId: string;
    externalHash?: string;
    isPending?: boolean;
}

export const TraceRow: React.FC<TraceRowProps> = memo(({ traceId, externalHash, isPending = false }) => {
    const [trace, setTrace] = useState<ToncenterTraceItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const formatTonAmount = (amount: string): string => {
        const tonAmount = parseFloat(amount || '0') / 1000000000; // Convert nanoTON to TON
        return tonAmount.toFixed(4);
    };

    const formatAddress = (addr: string): string => {
        if (!addr) return '';
        return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
    };

    const formatTimestamp = (timestamp: number): string => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    const formatMessageType = (msg: TransactionMessage | null): string => {
        if (!msg) return 'Internal';
        if (!msg.opcode || msg.opcode === '0x00000000') return 'Transfer';
        return `Op: ${msg.opcode.slice(0, 8)}`;
    };

    const renderTransactionPreview = (tx: TransactionData, index: number) => {
        const hasIncoming = tx.in_msg && tx.in_msg.value && parseFloat(tx.in_msg.value) > 0;
        const hasOutgoing = tx.out_msgs && tx.out_msgs.length > 0;

        return (
            <div key={tx.hash} className="border-l-2 border-gray-200 pl-4 py-2 ml-4">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                        <span className="text-gray-500 text-xs">#{index + 1}</span>
                        <span className="font-mono text-xs text-gray-600">
                            {tx.hash.slice(0, 8)}...{tx.hash.slice(-4)}
                        </span>
                        <span className="text-xs text-gray-500">{formatAddress(tx.account)}</span>
                    </div>
                    <div className="text-xs text-gray-500">Fee: {formatTonAmount(tx.total_fees || '0')} TON</div>
                </div>

                {/* Incoming message */}
                {hasIncoming && (
                    <div className="mt-1 text-xs">
                        <div className="flex items-center space-x-2 text-green-600">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 13l-5 5m0 0l-5-5m5 5V6"
                                />
                            </svg>
                            <span>In: +{formatTonAmount(tx.in_msg!.value!)} TON</span>
                            <span className="text-gray-500">from {formatAddress(tx.in_msg!.source || '')}</span>
                            <span className="text-gray-400">({formatMessageType(tx.in_msg || null)})</span>
                        </div>
                    </div>
                )}

                {/* Outgoing messages */}
                {hasOutgoing && (
                    <div className="mt-1 space-y-1">
                        {tx.out_msgs.slice(0, 3).map((msg: TransactionMessage, msgIndex: number) => (
                            <div key={msgIndex} className="flex items-center space-x-2 text-red-600 text-xs">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 11l5-5m0 0l5 5m-5-5v12"
                                    />
                                </svg>
                                <span>Out: -{formatTonAmount(msg.value || '0')} TON</span>
                                <span className="text-gray-500">to {formatAddress(msg.destination)}</span>
                                <span className="text-gray-400">({formatMessageType(msg)})</span>
                            </div>
                        ))}
                        {tx.out_msgs.length > 3 && (
                            <div className="text-xs text-gray-400 ml-5">+{tx.out_msgs.length - 3} more messages</div>
                        )}
                    </div>
                )}

                {/* Status indicator */}
                <div className="mt-1 flex items-center space-x-2 text-xs">
                    <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                            tx.description.aborted || !tx.description.compute_ph?.success
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                        }`}
                    >
                        {tx.description.aborted || !tx.description.compute_ph?.success ? 'Failed' : 'Success'}
                    </span>
                    {tx.emulated && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">Emulated</span>
                    )}
                </div>
            </div>
        );
    };

    // Analyze trace to determine transaction type and amount
    const analyzeTrace = (traceData: ToncenterTraceItem) => {
        if (!traceData.transactions || Object.keys(traceData.transactions).length === 0) {
            return {
                type: 'unknown' as const,
                amount: '0',
                address: '',
                timestamp: traceData.start_utime,
                status: 'failed' as const,
            };
        }

        // Get all transactions in the trace
        const transactions = Object.values(traceData.transactions);
        const mainTransaction = transactions[0]; // Usually the first transaction is the main one

        let type: 'send' | 'receive' | 'contract' = 'receive';
        let amount = '0';
        let address = '';
        let status: 'confirmed' | 'failed' = 'confirmed';

        // Check if any transaction failed
        const hasFailedTx = transactions.some((tx) => tx.description.aborted || !tx.description.compute_ph?.success);

        if (hasFailedTx) {
            status = 'failed';
        }

        // Analyze the main transaction
        if (mainTransaction) {
            // Check incoming message
            if (mainTransaction.in_msg && mainTransaction.in_msg.value) {
                amount = mainTransaction.in_msg.value;
                address = mainTransaction.in_msg.source || '';
                type = 'receive';
            }

            // Check outgoing messages - if there are any, it's likely a send transaction
            if (mainTransaction.out_msgs && mainTransaction.out_msgs.length > 0) {
                const mainOutMsg = mainTransaction.out_msgs[0];
                if (mainOutMsg.value) {
                    amount = mainOutMsg.value;
                    address = mainOutMsg.destination;
                    type = 'send';
                }
            }

            // If there are multiple transactions or complex interactions, mark as contract
            if (transactions.length > 1 || (traceData?.actions?.length ?? 0) > 0) {
                type = 'contract';
            }
        }

        return {
            type,
            amount,
            address,
            timestamp: traceData.start_utime,
            status,
        };
    };

    useEffect(() => {
        const fetchTrace = async () => {
            if (isPending) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                while (walletKit.isReady() === false) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }

                const apiClient = walletKit.getApiClient();
                let response;

                try {
                    if (traceId && !response) {
                        // Fetch by trace ID for completed traces
                        response = await apiClient.getTrace({
                            traceId: [traceId],
                        });
                    }
                } catch (error) {
                    log.error('Error fetching trace', { error });
                }
                try {
                    if (externalHash && !response) {
                        // Fetch by external message hash for pending traces
                        response = await apiClient.getPendingTrace({
                            externalMessageHash: [externalHash],
                        });
                    }
                } catch (error) {
                    log.error('Error fetching trace', { error });
                }

                try {
                    if (externalHash && !response) {
                        // Fetch by trace ID for completed traces
                        response = await apiClient.getTrace({
                            traceId: [externalHash],
                        });
                    }
                } catch (error) {
                    log.error('Error fetching trace', { error });
                }

                if (!response) {
                    setError('Trace not found');
                    return;
                }

                if (response.traces && response.traces.length > 0) {
                    setTrace(response.traces[0]);
                } else {
                    setError('Trace not found');
                }
            } catch (_err) {
                // Failed to fetch trace
                log.error('trace fetch error', _err);
                setError('Failed to load trace data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTrace();
    }, [traceId, externalHash, isPending]);

    if (isPending) {
        return (
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg animate-pulse">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-yellow-900">Processing Transaction</p>
                        <p className="text-xs text-yellow-700">Trace ID: {traceId.slice(0, 8)}...</p>
                        <p className="text-xs text-yellow-600">Pending confirmation</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-yellow-700">Processing...</p>
                    <p className="text-xs text-yellow-600">pending</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                    <div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
            </div>
        );
    }

    if (error || !trace) {
        return (
            <Link
                to={`/wallet/trace/${traceId}:${externalHash}`}
                className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
            >
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-red-900">Error Loading Trace</p>
                        <p className="text-xs text-red-700">{error}</p>
                    </div>
                </div>
            </Link>
        );
    }

    const traceInfo = analyzeTrace(trace);
    const transactionCount = Object.keys(trace.transactions).length;
    const actionCount = trace.actions?.length ?? 0;

    // Determine the link destination - use first transaction's hash
    const firstTxHash = trace.transactions_order?.[0] || Object.keys(trace.transactions)[0];
    const firstTx = trace.transactions[firstTxHash];
    const linkTo = firstTx?.in_msg?.hash
        ? `/wallet/trace/${Base64NormalizeUrl(firstTx.in_msg.hash)}`
        : `/wallet/trace/${traceId}`;

    const orderedTransactions = trace.transactions_order
        ? trace.transactions_order.map((hash) => trace.transactions[hash] as TransactionData)
        : (Object.values(trace.transactions) as TransactionData[]);

    return (
        <div className="bg-gray-50 rounded-lg overflow-hidden">
            {/* Main trace header - clickable for navigation */}
            <Link
                to={linkTo}
                className="flex items-center justify-between p-3 hover:bg-gray-100 transition-colors block no-underline"
            >
                <div className="flex items-center space-x-3">
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            traceInfo.status === 'failed'
                                ? 'bg-red-100'
                                : traceInfo.type === 'send'
                                  ? 'bg-red-100'
                                  : traceInfo.type === 'receive'
                                    ? 'bg-green-100'
                                    : 'bg-blue-100'
                        }`}
                    >
                        {traceInfo.status === 'failed' ? (
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        ) : traceInfo.type === 'send' ? (
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 11l5-5m0 0l5 5m-5-5v12"
                                />
                            </svg>
                        ) : traceInfo.type === 'receive' ? (
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
                        ) : (
                            <svg
                                className="w-4 h-4 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">
                            {traceInfo.status === 'failed'
                                ? 'Failed Transaction'
                                : traceInfo.type === 'send'
                                  ? 'Sent'
                                  : traceInfo.type === 'receive'
                                    ? 'Received'
                                    : 'Contract Interaction'}
                            {transactionCount > 1 && ` (${transactionCount} txs)`}
                            {actionCount > 0 && ` • ${actionCount} actions`}
                        </p>
                        <p className="text-xs text-gray-500">
                            {traceInfo.address ? formatAddress(traceInfo.address) : 'Multiple addresses'}
                        </p>
                        <p className="text-xs text-gray-400">{formatTimestamp(traceInfo.timestamp)}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="text-right">
                        <p
                            className={`text-sm font-medium ${
                                traceInfo.status === 'failed'
                                    ? 'text-red-600'
                                    : traceInfo.type === 'send'
                                      ? 'text-red-600'
                                      : traceInfo.type === 'receive'
                                        ? 'text-green-600'
                                        : 'text-blue-600'
                            }`}
                        >
                            {traceInfo.type === 'send' ? '-' : traceInfo.type === 'receive' ? '+' : ''}
                            {traceInfo.amount !== '0' ? `${formatTonAmount(traceInfo.amount)} TON` : 'Contract'}
                        </p>
                        <p
                            className={`text-xs ${traceInfo.status === 'confirmed' ? 'text-green-500' : 'text-red-500'}`}
                        >
                            {traceInfo.status}
                        </p>
                    </div>
                </div>
            </Link>

            {/* Expand/Collapse button for transaction previews */}
            {transactionCount > 1 && (
                <div className="border-t border-gray-200">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                        className="w-full px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors flex items-center justify-center space-x-1"
                    >
                        <span>
                            {isExpanded ? 'Hide' : 'Show'} {transactionCount} transactions
                        </span>
                        <svg
                            className={`w-3 h-3 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Transaction previews */}
            {isExpanded && transactionCount > 1 && (
                <div className="border-t border-gray-200 bg-gray-25 p-3 space-y-3">
                    <div className="text-xs text-gray-500 font-medium mb-2">Transaction Details:</div>
                    {orderedTransactions.map((tx, index) => renderTransactionPreview(tx, index))}
                </div>
            )}
        </div>
    );
});
