/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useWalletStore } from '@demo/core';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

export const useTransactionEvents = (limit = 20) => {
    const { events, loadEvents, address, hasNextEvents } = useWalletStore(
        useShallow((state) => ({
            events: state.walletManagement.events,
            loadEvents: state.loadEvents,
            address: state.walletManagement.address,
            hasNextEvents: state.walletManagement.hasNextEvents,
        })),
    );
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(0);

    // Load events when component mounts, address changes, or page changes
    useEffect(() => {
        const fetchEvents = async () => {
            if (!address) return;

            // Determine if this is initial load
            const isInitial = currentPage === 0 && (!events || events.length === 0);

            if (isInitial) {
                setIsInitialLoading(true);
            }

            setError(null);
            try {
                const offset = currentPage * limit;
                await loadEvents(limit, offset);
            } catch (_err) {
                setError('Failed to load events');
            } finally {
                setIsInitialLoading(false);
            }
        };

        void fetchEvents();
    }, [address, loadEvents, currentPage, limit]);

    const handleRefresh = async () => {
        if (!address) return;

        setIsRefreshing(true);
        setError(null);
        try {
            const offset = currentPage * limit;
            await loadEvents(limit, offset);
        } catch (_err) {
            setError('Failed to refresh events');
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleNextPage = () => {
        if (hasNextEvents && !isRefreshing) {
            setCurrentPage((prev) => prev + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 0 && !isRefreshing) {
            setCurrentPage((prev) => prev - 1);
        }
    };

    return {
        events: events || [],
        isInitialLoading,
        isRefreshing,
        error,
        currentPage,
        hasNextEvents,
        address,
        handleRefresh,
        handleNextPage,
        handlePreviousPage,
    };
};
