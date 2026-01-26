/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Query } from './query';
import type { QueryClient } from './query-client';
import type { QueryKey, QueryOptions } from '../types/query';

export class QueryCache {
    private queries: Map<string, Query<unknown, unknown>>;

    constructor() {
        this.queries = new Map();
    }

    build<TData, TError>(
        _client: QueryClient,
        options: QueryOptions<TData, TError>,
        _state?: unknown,
    ): Query<TData, TError> {
        const queryHash = this.hashKey(options.queryKey);
        let query = this.queries.get(queryHash);

        if (!query) {
            query = new Query({
                cache: this,
                queryKey: options.queryKey,
                queryHash,
                options,
            });
            this.add(query);
        }

        return query as Query<TData, TError>;
    }

    add(query: Query<unknown, unknown>) {
        if (!this.queries.has(query.queryHash)) {
            this.queries.set(query.queryHash, query);
        }
    }

    remove(query: Query<unknown, unknown>) {
        if (this.queries.has(query.queryHash)) {
            this.queries.delete(query.queryHash);
        }
    }

    clear() {
        this.queries.clear();
    }

    get(queryHash: string): Query<unknown, unknown> | undefined {
        return this.queries.get(queryHash);
    }

    getAll(): Query<unknown, unknown>[] {
        return Array.from(this.queries.values());
    }

    find<TData = unknown, TError = unknown>(queryKey: QueryKey): Query<TData, TError> | undefined {
        const queryHash = this.hashKey(queryKey);
        return this.queries.get(queryHash) as Query<TData, TError> | undefined;
    }

    hashKey(queryKey: QueryKey): string {
        return JSON.stringify(queryKey, (_, val) =>
            val !== null && typeof val === 'object' && !Array.isArray(val)
                ? Object.keys(val)
                      .sort()
                      .reduce(
                          (result, key) => {
                              result[key] = val[key];
                              return result;
                          },
                          {} as Record<string, unknown>,
                      )
                : val,
        );
    }
}
