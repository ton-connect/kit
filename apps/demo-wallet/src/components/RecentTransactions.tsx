/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { memo, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Base64NormalizeUrl, HexToBase64, type Hex } from '@ton/walletkit';

import { useStore, useWalletKit } from '../stores';
import type { PreviewTransaction } from '../types/wallet';
import { TraceRow } from './TraceRow';

export const RecentTransactions: React.FC = memo(() => {
    const { events, loadEvents, address } = useStore(
        useShallow((state) => ({
            events: state.wallet.events,
            loadEvents: state.loadEvents,
            address: state.wallet.address,
        })),
    );
    const walletKit = useWalletKit();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendingTransactions, setPendingTransactions] = useState<PreviewTransaction[]>([]);

    const formatTimestamp = (timestampSeconds: number): string => {
        return new Date(timestampSeconds * 1000).toLocaleString();
    };

    const formatAddress = (addr: string): string => {
        if (!addr) return '';
        return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
    };

    const formatNanoTon = (value: bigint | string): string => {
        const n = typeof value === 'bigint' ? value : BigInt(value || '0');
        const str = n.toString();
        const pad = str.padStart(10, '0');
        const intPart = pad.slice(0, pad.length - 9).replace(/^0+(?=\d)/, '');
        const fracPart = pad.slice(-9).replace(/0+$/, '');
        return `${intPart === '' ? '0' : intPart}${fracPart ? '.' + fracPart : ''}`;
    };

    // Check for pending transactions
    const checkPendingTransactions = async () => {
        if (!address || !walletKit) return;

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

    // Load events when component mounts or address changes
    useEffect(() => {
        const fetchEvents = async () => {
            if (!address) return;

            setIsLoading(true);
            setError(null);
            try {
                await loadEvents(10);
            } catch (_err) {
                setError('Failed to load events');
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvents();
    }, [address, loadEvents]);

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
            await loadEvents(10);
        } catch (_err) {
            setError('Failed to refresh events');
        } finally {
            setIsLoading(false);
        }
    };
    interface EventLike {
        eventId: string;
        timestamp: number;
        actions?: unknown[];
    }

    interface TonTransferActionLike {
        id: string;
        type: 'TonTransfer';
        TonTransfer: {
            sender: { address: string };
            recipient: { address: string };
            amount: string | bigint;
            comment?: string;
        };
    }

    const eventItems = useMemo(() => (events || []) as unknown as EventLike[], [events]);

    const renderTransferRow = (ev: EventLike, action: TonTransferActionLike) => {
        const my = address || '';
        const isOutgoing = action.TonTransfer.sender.address === my;
        const amount = formatNanoTon(action.TonTransfer.amount);
        const other = isOutgoing ? action.TonTransfer.recipient.address : action.TonTransfer.sender.address;
        const traceId = Base64NormalizeUrl(HexToBase64(ev.eventId as unknown as Hex));

        return (
            <a
                key={`${ev.eventId}`}
                href={`/wallet/trace/${traceId}`}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-gray-100"
            >
                <div className="flex items-center space-x-3">
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${isOutgoing ? 'bg-red-100' : 'bg-green-100'}`}
                    >
                        {isOutgoing ? (
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <p className="text-sm font-medium text-gray-900">{isOutgoing ? 'Sent TON' : 'Received TON'}</p>
                        <p className="text-xs text-gray-500">{formatAddress(other)}</p>
                        {action.TonTransfer.comment && (
                            <p className="mt-1 text-xs text-gray-600 break-all">{action.TonTransfer.comment}</p>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <p className={`text-sm font-medium ${isOutgoing ? 'text-red-600' : 'text-green-600'}`}>
                        {isOutgoing ? '-' : '+'}
                        {amount} TON
                    </p>
                    <p className="text-xs text-gray-400">{formatTimestamp(ev.timestamp)}</p>
                </div>
            </a>
        );
    };

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
                    title="Refresh"
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
                ) : (eventItems?.length ?? 0) === 0 ? (
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
                        <p className="text-gray-500 text-sm">No activity yet</p>
                        <p className="text-gray-400 text-xs mt-1">Your history will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pendingTransactions.map((p) => (
                            <TraceRow key={`pending-${p.id}`} traceId={p.id} externalHash={p.messageHash} isPending />
                        ))}
                        {(eventItems || []).slice(0, 10).map((ev) => {
                            const tonTransfers = ((ev.actions || []) as unknown as TonTransferActionLike[]).filter(
                                (a: TonTransferActionLike | { type?: string }) => a.type === 'TonTransfer',
                            );
                            if (tonTransfers.length === 0) {
                                // Fallback to TraceRow when no TonTransfer actions are present
                                const traceId = Base64NormalizeUrl(HexToBase64(ev.eventId as unknown as Hex));
                                return <TraceRow key={ev.eventId} traceId={traceId} />;
                            }
                            // Choose primary transfer: involving our address if present, otherwise the first one
                            const primary =
                                tonTransfers.find(
                                    (a) =>
                                        a.TonTransfer.sender.address === (address || '') ||
                                        a.TonTransfer.recipient.address === (address || ''),
                                ) || tonTransfers[0];
                            return renderTransferRow(ev, primary);
                        })}
                    </div>
                )}
            </div>
        </div>
    );
});
