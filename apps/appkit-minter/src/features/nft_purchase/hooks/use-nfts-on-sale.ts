/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { UseInfiniteQueryResult } from '@tanstack/react-query';

import { fetchNftsOnSale } from '../api/getgems-client';
import type { GetGemsNftOnSale, GetGemsNftsOnSaleResponse } from '../api/types';
import { isFixPriceSale } from '../api/types';

export interface UseNftsOnSaleOptions {
    /** Restrict results to fix-price sales in this currency (case-insensitive, e.g. "USDT"). */
    currency?: string;
    /** Page size forwarded to the GetGems API (1..100). Defaults to 100. */
    pageSize?: number;
    /** Auto-fetch next pages while the active filter yields zero matches. Defaults to true. */
    autoLoadWhileEmpty?: boolean;
}

export interface UseNftsOnSaleResult {
    /** Items matching the active filter, flattened across all loaded pages. */
    items: GetGemsNftOnSale[];
    /** Total items returned by the API across all loaded pages (pre-filter). */
    totalLoaded: number;
    /** Number of pages fetched so far. */
    loadedPages: number;
    isLoading: boolean;
    isError: boolean;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
    refetch: UseInfiniteQueryResult<unknown, Error>['refetch'];
}

export function useNftsOnSale(collectionAddress: string, options: UseNftsOnSaleOptions = {}): UseNftsOnSaleResult {
    const { currency, pageSize = 100, autoLoadWhileEmpty = true } = options;
    const currencyFilter = currency?.toUpperCase();

    const query = useInfiniteQuery<GetGemsNftsOnSaleResponse, Error>({
        queryKey: ['getgems', 'nfts-on-sale', collectionAddress, pageSize],
        queryFn: ({ pageParam }) =>
            fetchNftsOnSale(collectionAddress, { limit: pageSize, after: pageParam as string | null }),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.cursor ?? undefined,
        staleTime: 30_000,
    });

    const { items, totalLoaded } = useMemo(() => {
        const flat = query.data?.pages.flatMap((page) => page.items) ?? [];
        const filtered = flat.filter((nft) => {
            if (!isFixPriceSale(nft.sale)) return false;
            if (currencyFilter && nft.sale.currency.toUpperCase() !== currencyFilter) return false;
            return true;
        });
        return { items: filtered, totalLoaded: flat.length };
    }, [query.data, currencyFilter]);

    const hasNextPage = query.hasNextPage ?? false;

    useEffect(() => {
        if (!autoLoadWhileEmpty) return;
        if (items.length > 0) return;
        if (!hasNextPage) return;
        if (query.isFetching) return;
        query.fetchNextPage();
    }, [autoLoadWhileEmpty, items.length, hasNextPage, query]);

    return {
        items,
        totalLoaded,
        loadedPages: query.data?.pages.length ?? 0,
        isLoading: query.isLoading,
        isError: query.isError,
        hasNextPage,
        isFetchingNextPage: query.isFetchingNextPage,
        fetchNextPage: () => void query.fetchNextPage(),
        refetch: query.refetch,
    };
}
