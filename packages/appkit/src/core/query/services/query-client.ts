/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { QueryCache } from './query-cache';
import type { QueryOptions, QueryKey } from '../types/query';

export class QueryClient {
    private queryCache: QueryCache;

    constructor() {
        this.queryCache = new QueryCache();
    }

    getQueryCache() {
        return this.queryCache;
    }

    async fetchQuery<TData = unknown, TError = unknown>(options: QueryOptions<TData, TError>): Promise<TData> {
        const query = this.queryCache.build<TData, TError>(this, options);
        return query.fetch(options);
    }

    async prefetchQuery<TData = unknown, TError = unknown>(options: QueryOptions<TData, TError>): Promise<void> {
        const query = this.queryCache.build<TData, TError>(this, options);
        if (query.isStale()) {
            await query.fetch(options);
        }
    }

    getQueryData<TData = unknown>(queryKey: QueryKey): TData | undefined {
        const query = this.queryCache.find<TData>(queryKey);
        return query?.state.data;
    }

    setQueryData<TData = unknown>(queryKey: QueryKey, data: TData): TData | undefined {
        const query = this.queryCache.find<TData>(queryKey);
        if (query) {
            query.setData(data);
            return data;
        }
        return undefined; // Or creating new query if doesn't exist? Tanstack creates one.
    }

    // Additional helpful methods
    ensureQueryData<TData = unknown, TError = unknown>(options: QueryOptions<TData, TError>): Promise<TData> {
        const query = this.queryCache.build<TData, TError>(this, options);
        if (!query.isStale()) {
            return Promise.resolve(query.state.data!);
        }
        return query.fetch(options);
    }

    invalidateQueries(queryKey?: QueryKey) {
        if (!queryKey) {
            this.queryCache.getAll().forEach((q) => q.invalidate());
            return;
        }

        // Exact match for now, or partial match if we implement sophisticated matching
        // For simplicity: exact match on key structure or start match
        // Let's implement simple partial match: check if existing key starts with provided key parts
        const queries = this.queryCache.getAll();
        queries.forEach((q) => {
            if (this.matchKey(q.queryKey, queryKey)) {
                q.invalidate();
            }
        });
    }

    private matchKey(key: QueryKey, filter: QueryKey): boolean {
        if (Array.isArray(filter)) {
            if (!Array.isArray(key)) return false;
            // Check if key starts with filter
            if (filter.length > key.length) return false;
            return filter.every((val, index) => JSON.stringify(val) === JSON.stringify(key[index]));
        }
        return JSON.stringify(key) === JSON.stringify(filter);
    }
}
