/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWalletStore } from '@demo/wallet-core';
import { Base64ToHex } from '@ton/walletkit';
import type { Event } from '@ton/walletkit';

import { mapEventToRow, mapPendingToRow } from '../utils/map-transaction-row';
import type { TransactionRowModel } from '../utils/map-transaction-row';

const nowSeconds = (): number => Math.floor(Date.now() / 1000);

/**
 * Default page size for /traces. 25 (not the visual preview count) because toncenter returns
 * 500 ("timeout: context deadline exceeded") for small limits (1..10) — see loadEvents. Both
 * the dashboard preview and the history page fetch this same first page (offset 0), so the
 * store coalesces them into one request.
 */
export const EVENTS_PAGE_SIZE = 25;

interface TransactionRows {
    rows: TransactionRowModel[];
    hasMore: boolean;
    /** True while the first page of events is still being fetched — show a shimmer. */
    isLoading: boolean;
    /**
     * True only when it's genuinely correct to show the "No transactions yet" empty state:
     * loading has finished, the last fetch did not fail, and there are zero rows. A fresh/uninit
     * account (status 'uninitialized' | 'non-existing') qualifies; a timed-out fetch does not.
     */
    showEmpty: boolean;
    /** True when the first-page fetch failed and no rows are loaded — show an error, not a shimmer. */
    isError: boolean;
    /** Fetch the next page by offset and append it to the accumulated events. */
    loadMore: () => void;
}

/**
 * Loads the latest events (first page, newest first), merges pending transactions and maps
 * everything to rows. Shared by the dashboard preview and the full history page. Pagination
 * is by offset: the first page is (pageSize, 0); `loadMore` fetches (pageSize, events.length)
 * and the store appends it (dedupe by eventId).
 */
export const useTransactionRows = (pageSize: number = EVENTS_PAGE_SIZE): TransactionRows => {
    const {
        events,
        loadEvents,
        address,
        pendingTransactions,
        network,
        hasMore,
        isLoadingEvents,
        eventsLoaded,
        eventsError,
        accountStatus,
    } = useWalletStore(
        useShallow((state) => {
            const activeWallet = state.walletManagement.savedWallets.find(
                (w) => w.id === state.walletManagement.activeWalletId,
            );
            return {
                events: state.walletManagement.events,
                loadEvents: state.loadEvents,
                address: state.walletManagement.address,
                pendingTransactions: state.walletManagement.pendingTransactions,
                network: activeWallet?.network ?? 'testnet',
                hasMore: state.walletManagement.hasNextEvents,
                isLoadingEvents: state.walletManagement.isLoadingEvents,
                eventsLoaded: state.walletManagement.eventsLoaded,
                eventsError: state.walletManagement.eventsError,
                accountStatus: state.walletManagement.accountStatus,
            };
        }),
    );

    // Fetch the first page (offset 0, which resets the accumulated list) when the wallet or
    // page size changes. `loadEvents` is a stable store action; the in-flight guard inside it
    // coalesces the StrictMode double-invoke and the dashboard+history duplicate mount.
    useEffect(() => {
        if (!address) return;
        void loadEvents(pageSize, 0);
    }, [address, loadEvents, pageSize]);

    // "Load more": fetch the next offset page and append it. Offset is the count of events
    // already loaded, so pages are (pageSize, 0) → (pageSize, pageSize) → (pageSize, 2*pageSize)…
    const loadMore = useCallback(() => {
        if (!address || isLoadingEvents || !hasMore) return;
        void loadEvents(pageSize, events.length);
    }, [address, isLoadingEvents, hasMore, loadEvents, pageSize, events]);

    const rows = useMemo<TransactionRowModel[]>(() => {
        const eventItems = (events ?? []) as Event[];
        const myAddress = address ?? '';

        // Drop pending entries already confirmed by a loaded event.
        const confirmedTraceIds = new Set<string>();
        const confirmedExternalHashes = new Set<string>();
        for (const ev of eventItems) {
            if (ev.eventId) confirmedTraceIds.add(String(ev.eventId));
            if (ev.traceExternalHash) confirmedExternalHashes.add(Base64ToHex(ev.traceExternalHash));
        }

        const seen = new Set<string>();
        const pendingRows = pendingTransactions
            .filter((p) => {
                if (p.traceId && confirmedTraceIds.has(p.traceId)) return false;
                if (p.externalHash && confirmedExternalHashes.has(p.externalHash)) return false;
                if (seen.has(p.traceId)) return false;
                seen.add(p.traceId);
                return true;
            })
            .map((p) => {
                const timestamp = p.preview?.timestamp ?? nowSeconds();
                return { timestamp, row: mapPendingToRow(p, myAddress, timestamp, network) };
            });

        const eventRows = eventItems
            .map((ev) => ({ timestamp: ev.timestamp, row: mapEventToRow(ev, myAddress, network) }))
            .filter((item): item is { timestamp: number; row: TransactionRowModel } => item.row !== null);

        return [...pendingRows, ...eventRows].sort((a, b) => b.timestamp - a.timestamp).map((item) => item.row);
    }, [events, pendingTransactions, address, network]);

    // A brand-new / never-deployed account (fresh wallet) reports 'uninitialized' or
    // 'non-existing' from /api/v3/addressInformation — it definitionally has no transactions.
    const isFreshAccount = accountStatus === 'uninitialized' || accountStatus === 'non-existing';

    // Before the first fetch completes, treat as loading (show shimmer, never "empty") —
    // unless the account is already known to be fresh (then "no transactions" is immediate).
    const isLoading = !!address && (isLoadingEvents || !eventsLoaded) && !isFreshAccount;

    // "No transactions yet" is truthful when there are zero rows AND either the account is a
    // fresh/uninit account, or a successful (non-errored) load has completed. A timed-out/failed
    // fetch (eventsError) never shows empty — it surfaces as isError (below) instead.
    const showEmpty =
        !!address &&
        rows.length === 0 &&
        (isFreshAccount || (eventsLoaded && !eventsError && !isLoadingEvents));

    // The first-page fetch failed and there is nothing to show — surface an error instead of an
    // endless shimmer (dashboard hides the block; the page shows a short error line). A failure
    // on a later "Load more" page keeps the rows already on screen, so isError stays false there.
    const isError = !!address && rows.length === 0 && eventsError && !isLoadingEvents;

    return { rows, hasMore, isLoading, showEmpty, isError, loadMore };
};
