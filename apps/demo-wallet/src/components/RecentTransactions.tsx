/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { memo, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Base64NormalizeUrl, HexToBase64, type Event, type Action } from '@ton/walletkit';

import { useStore } from '../stores';
import { TraceRow } from './TraceRow';
import { TransactionErrorState, TransactionLoadingState, TransactionEmptyState, ActionCard } from './transactions';

/**
 * Recent Transactions component
 * Displays a list of recent blockchain transactions for the current wallet
 */
export const RecentTransactions: React.FC = memo(() => {
    const { events, loadEvents, address, hasNextEvents } = useStore(
        useShallow((state) => ({
            events: state.wallet.events,
            loadEvents: state.loadEvents,
            address: state.wallet.address,
            hasNextEvents: state.wallet.hasNextEvents,
        })),
    );
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [limit] = useState(10);

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

    // Count pending events for the header badge
    // The API returns events with inProgress flag for pending transactions
    const pendingEvents = useMemo(() => {
        return (eventItems || []).filter((ev) => ev.inProgress);
    }, [eventItems]);

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
                    {pendingEvents.length > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {pendingEvents.length} pending
                        </span>
                    )}
                </div>
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

            {/* Content */}
            <div className="p-6 relative">
                {error ? (
                    <TransactionErrorState error={error} onRetry={handleRefresh} />
                ) : isInitialLoading ? (
                    <TransactionLoadingState />
                ) : (eventItems?.length ?? 0) === 0 && currentPage === 0 ? (
                    <TransactionEmptyState />
                ) : (eventItems?.length ?? 0) === 0 && currentPage > 0 ? (
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
                            className={`space-y-3 transition-opacity duration-200 ${isPaginating ? 'opacity-50' : 'opacity-100'}`}
                        >
                            {/* All events (both pending and confirmed) */}
                            {(eventItems || []).map((ev) => {
                                const traceId = Base64NormalizeUrl(HexToBase64(ev.eventId));

                                // If no actions, fallback to TraceRow
                                if (!ev.actions || ev.actions.length === 0) {
                                    return <TraceRow key={ev.eventId} traceId={traceId} />;
                                }

                                // For events with multiple actions, show the first action that involves the user's address
                                const relevantAction =
                                    ev.actions.find((a: Action) =>
                                        a.simplePreview?.accounts?.some((acc) => acc.address === (address || '')),
                                    ) || ev.actions[0];

                                return (
                                    <ActionCard
                                        key={ev.eventId}
                                        action={relevantAction}
                                        myAddress={address || ''}
                                        timestamp={ev.timestamp}
                                        traceLink={`/wallet/trace/${traceId}`}
                                        isPending={ev.inProgress}
                                    />
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Pagination controls */}
            {!error && !isInitialLoading && (currentPage > 0 || (eventItems?.length ?? 0) > 0) && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
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
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 19l-7-7 7-7"
                                    />
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
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            )}
                        </button>
                    ) : (
                        <div />
                    )}
                </div>
            )}
        </div>
    );
});

RecentTransactions.displayName = 'RecentTransactions';
