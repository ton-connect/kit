/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { useWalletStore } from '@demo/wallet-core';
import { Base64NormalizeUrl, HexToBase64 } from '@ton/walletkit';
import type { Event, Action } from '@ton/walletkit';

import { formatTonForDisplay, sameAddress } from '../utils';
import { TraceRow } from './TraceRow';
import { TransactionErrorState, TransactionLoadingState, TransactionEmptyState, ActionCard } from './transactions';

interface RecentTransactionsProps {
    embedded?: boolean;
}

/**
 * Recent Transactions component
 * Displays a list of recent blockchain transactions for the current wallet
 */
export const RecentTransactions: React.FC<RecentTransactionsProps> = memo(({ embedded = false }) => {
    const { events, loadEvents, address, hasNextEvents, pendingTransactions } = useWalletStore(
        useShallow((state) => ({
            events: state.walletManagement.events,
            loadEvents: state.loadEvents,
            address: state.walletManagement.address,
            hasNextEvents: state.walletManagement.hasNextEvents,
            pendingTransactions: state.walletManagement.pendingTransactions,
        })),
    );
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [limit] = useState(10);
    const seenKeysRef = useRef<Set<string>>(new Set());
    const hasShownListRef = useRef(false);

    useEffect(() => {
        seenKeysRef.current = new Set();
        hasShownListRef.current = false;
    }, [address]);

    // Load events when component mounts, address changes, or page changes
    useEffect(() => {
        const fetchEvents = async () => {
            if (!address) return;

            // Determine if this is initial load or pagination
            const isInitial = currentPage === 0 && eventItems.length === 0;

            if (isInitial) {
                setIsInitialLoading(true);
            } else {
                setIsPaginating(true);
            }

            setError(null);
            try {
                const offset = currentPage * limit;
                await loadEvents(limit, offset);
            } catch (_err) {
                setError('Failed to load events');
            } finally {
                setIsInitialLoading(false);
                setIsPaginating(false);
            }
        };

        fetchEvents();
    }, [address, loadEvents, currentPage, limit]);

    const handleRefresh = async () => {
        if (!address) return;

        setIsPaginating(true);
        setError(null);
        try {
            const offset = currentPage * limit;
            await loadEvents(limit, offset);
        } catch (_err) {
            setError('Failed to refresh events');
        } finally {
            setIsPaginating(false);
        }
    };

    const handleNextPage = () => {
        if (hasNextEvents && !isPaginating) {
            setCurrentPage((prev) => prev + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 0 && !isPaginating) {
            setCurrentPage((prev) => prev - 1);
        }
    };

    const eventItems = useMemo(() => (events || []) as Event[], [events]);

    // Build sets: trace_id and trace_external_hash are different - never compare one to the other
    const { confirmedTraceIds, confirmedExternalHashes } = useMemo(() => {
        const traceIds = new Set<string>();
        const extHashes = new Set<string>();
        for (const ev of eventItems) {
            if (ev.eventId) traceIds.add(Base64NormalizeUrl(HexToBase64(ev.eventId)));
            if (ev.traceExternalHash) extHashes.add(Base64NormalizeUrl(ev.traceExternalHash));
        }
        return { confirmedTraceIds: traceIds, confirmedExternalHashes: extHashes };
    }, [eventItems]);

    // Merge pending + events, sort by timestamp desc. Remove pending when we have matching event (confirmed).
    const mergedItems = useMemo(() => {
        const filteredPending = pendingTransactions.filter((p) => {
            if (p.traceIdFromFirstTx && confirmedTraceIds.has(Base64NormalizeUrl(p.traceIdFromFirstTx))) return false;
            if (p.traceId && confirmedTraceIds.has(Base64NormalizeUrl(p.traceId))) return false;
            if (p.externalHash && confirmedExternalHashes.has(Base64NormalizeUrl(p.externalHash))) return false;
            return true;
        });
        // Dedupe pending by trace_id
        const seenByTraceId = new Set<string>();
        const dedupedPending = filteredPending.filter((p) => {
            const key = Base64NormalizeUrl(p.traceId);
            if (seenByTraceId.has(key)) return false;
            seenByTraceId.add(key);
            return true;
        });
        const pendingAsItems = dedupedPending.map((p) => ({
            type: 'pending' as const,
            traceId: p.traceId,
            externalHash: p.externalHash,
            timestamp: p.preview?.timestamp ?? Math.floor(Date.now() / 1000),
            data: p,
        }));
        const eventAsItems = eventItems.map((ev) => {
            const traceIdNorm = Base64NormalizeUrl(HexToBase64(ev.eventId));
            return {
                type: 'event' as const,
                traceId: traceIdNorm,
                externalHash: ev.traceExternalHash ? Base64NormalizeUrl(ev.traceExternalHash) : undefined,
                timestamp: ev.timestamp,
                data: ev,
            };
        });
        const combined = [...pendingAsItems, ...eventAsItems];
        combined.sort((a, b) => b.timestamp - a.timestamp);

        return combined;
    }, [pendingTransactions, eventItems, confirmedTraceIds, confirmedExternalHashes]);

    // Reset seenKeys when first showing list so items animate (works with React Strict Mode double-mount)
    if (!isInitialLoading && mergedItems.length > 0 && !hasShownListRef.current) {
        hasShownListRef.current = true;
        seenKeysRef.current = new Set();
    }

    const header = !embedded && (
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
            <button
                onClick={handleRefresh}
                disabled={isPaginating}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                title="Refresh"
            >
                <svg
                    className={`w-4 h-4 ${isPaginating ? 'animate-spin' : ''}`}
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
    );

    const content = (
        <div className={`relative ${embedded ? 'py-2 border-t border-gray-100' : 'p-6'}`}>
            {error ? (
                <TransactionErrorState error={error} onRetry={handleRefresh} />
            ) : isInitialLoading ? (
                <TransactionLoadingState />
            ) : mergedItems.length === 0 && currentPage === 0 ? (
                <TransactionEmptyState />
            ) : mergedItems.length === 0 && currentPage > 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">No transactions on this page</p>
                </div>
            ) : (
                <>
                    {/* Loading overlay during pagination */}
                    {isPaginating && (
                        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <svg
                                    className="animate-spin h-5 w-5 text-gray-600"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                <span className="text-sm text-gray-600">Loading...</span>
                            </div>
                        </div>
                    )}

                    <div
                        className={`transition-opacity duration-200 ${embedded ? 'space-y-0' : 'space-y-3'} ${isPaginating ? 'opacity-50' : 'opacity-100'}`}
                    >
                        {mergedItems.map((item) => {
                            const itemKey = item.type === 'pending' ? `pending-${item.data.traceId}` : item.traceId;
                            const isNew = !seenKeysRef.current.has(itemKey);
                            if (isNew) seenKeysRef.current.add(itemKey);

                            const layoutTransition = { type: 'tween' as const, duration: 0.275 };
                            const motionProps = {
                                layout: true,
                                initial: isNew ? { opacity: 0, y: -20 } : false,
                                animate: { opacity: 1, y: 0 },
                                transition: layoutTransition,
                            };

                            if (item.type === 'pending') {
                                const p = item.data;
                                const preview = p.preview;
                                const isPending = p.finality !== 'confirmed' && p.finality !== 'finalized';

                                const finality = p.finality ?? 'pending';
                                if (p.action) {
                                    return (
                                        <motion.div key={itemKey} {...motionProps}>
                                            <ActionCard
                                                action={p.action}
                                                myAddress={address || ''}
                                                timestamp={preview?.timestamp ?? Math.floor(Date.now() / 1000)}
                                                traceLink={
                                                    isPending
                                                        ? undefined
                                                        : `/wallet/trace/${p.traceId}${p.externalHash ? ':' + p.externalHash : ''}`
                                                }
                                                isPending={isPending}
                                                finality={finality}
                                                debugId={`pending-${p.traceId.slice(0, 12)}`}
                                            />
                                        </motion.div>
                                    );
                                }

                                const amountFormatted = preview ? formatTonForDisplay(preview.amount) : '0';
                                const description = preview
                                    ? preview.type === 'send'
                                        ? `Sent ${amountFormatted} TON`
                                        : preview.type === 'receive'
                                          ? `Received ${amountFormatted} TON`
                                          : `Transfer ${amountFormatted} TON`
                                    : 'Processing';
                                const value = preview ? `${amountFormatted} TON` : '0 TON';

                                const pendingAction = {
                                    type: 'TonTransfer',
                                    id: p.traceId,
                                    status: 'success' as const,
                                    simplePreview: {
                                        name: 'Ton Transfer',
                                        description,
                                        value,
                                        accounts:
                                            preview && address
                                                ? preview.type === 'send'
                                                    ? [{ address, isScam: false, isWallet: true }]
                                                    : [{ address: preview.address, isScam: false, isWallet: false }]
                                                : [],
                                    },
                                    baseTransactions: [] as string[],
                                    TonTransfer: {
                                        sender: {
                                            address: preview?.type === 'send' ? address || '' : preview?.address || '',
                                            isScam: false,
                                            isWallet: true,
                                        },
                                        recipient: {
                                            address: preview?.type === 'send' ? preview?.address || '' : address || '',
                                            isScam: false,
                                            isWallet: false,
                                        },
                                        amount: BigInt(preview?.amount || 0),
                                    },
                                } as Action;

                                return (
                                    <motion.div key={itemKey} {...motionProps}>
                                        <ActionCard
                                            action={pendingAction}
                                            myAddress={address || ''}
                                            timestamp={preview?.timestamp ?? Math.floor(Date.now() / 1000)}
                                            traceLink={
                                                isPending
                                                    ? undefined
                                                    : `/wallet/trace/${p.traceId}${p.externalHash ? ':' + p.externalHash : ''}`
                                            }
                                            isPending={isPending}
                                            finality={finality}
                                            debugId={`pending-${p.traceId.slice(0, 12)}`}
                                        />
                                    </motion.div>
                                );
                            }

                            const ev = item.data;
                            const traceId = item.traceId;
                            const externalHash = item.externalHash ?? traceId;

                            if (!ev.actions || ev.actions.length === 0) {
                                const rowDebugId = `event-row-${traceId.slice(0, 12)}`;
                                return (
                                    <motion.div key={itemKey} {...motionProps}>
                                        <div className="relative">
                                            <span
                                                className="absolute top-1 right-1 text-[9px] font-mono text-gray-300 z-10"
                                                title={rowDebugId}
                                            >
                                                {rowDebugId}
                                            </span>
                                            <TraceRow traceId={traceId} externalHash={externalHash} />
                                        </div>
                                    </motion.div>
                                );
                            }

                            const myAddr = address || '';
                            const withMe = ev.actions.filter((a: Action) =>
                                a.simplePreview?.accounts?.some((acc) => sameAddress(acc.address, myAddr)),
                            );
                            const preferSender = (a: Action) => {
                                if (a.type === 'TonTransfer' && 'TonTransfer' in a)
                                    return sameAddress(a.TonTransfer.sender.address, myAddr);
                                if (a.type === 'JettonTransfer' && 'JettonTransfer' in a)
                                    return sameAddress(a.JettonTransfer.sender.address, myAddr);
                                if (a.type === 'NftItemTransfer' && 'NftItemTransfer' in a)
                                    return sameAddress(a.NftItemTransfer.sender.address, myAddr);
                                return (
                                    a.simplePreview?.accounts?.[0] &&
                                    sameAddress(a.simplePreview.accounts[0].address, myAddr)
                                );
                            };
                            const relevantAction = withMe.find(preferSender) || withMe[0] || ev.actions[0];

                            return (
                                <motion.div key={itemKey} {...motionProps}>
                                    <ActionCard
                                        action={relevantAction}
                                        myAddress={address || ''}
                                        timestamp={ev.timestamp}
                                        traceLink={`/wallet/trace/${traceId}`}
                                        finality="done"
                                        debugId={`event-${traceId.slice(0, 12)}`}
                                    />
                                </motion.div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );

    const pagination = !error && !isInitialLoading && (currentPage > 0 || (eventItems?.length ?? 0) > 0) && (
        <div
            className={`flex items-center justify-between ${embedded ? 'py-2 border-t border-gray-100' : 'px-6 py-4 border-t border-gray-200'}`}
        >
            {currentPage > 0 ? (
                <button
                    onClick={handlePreviousPage}
                    disabled={isPaginating}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isPaginating ? (
                        <svg
                            className="animate-spin h-4 w-4 mr-1"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    )}
                    Previous
                </button>
            ) : (
                <div />
            )}

            <div className="text-sm text-gray-700">Page {currentPage + 1}</div>

            {hasNextEvents ? (
                <button
                    onClick={handleNextPage}
                    disabled={isPaginating}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    Next
                    {isPaginating ? (
                        <svg
                            className="animate-spin h-4 w-4 ml-1"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    )}
                </button>
            ) : (
                <div />
            )}
        </div>
    );

    if (embedded) {
        return (
            <div className="space-y-0">
                {header}
                {content}
                {pagination}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
            {header}
            {content}
            {pagination}
        </div>
    );
});

RecentTransactions.displayName = 'RecentTransactions';
