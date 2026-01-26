/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { QueryCache } from './query-cache';
import type { QueryKey, QueryOptions, QueryObserver, QueryState } from '../types/query';

export class Query<TData = unknown, TError = unknown> {
    queryKey: QueryKey;
    queryHash: string;
    options: QueryOptions<TData, TError>;
    state: QueryState<TData, TError>;
    promise?: Promise<TData>;
    gcTimeout?: ReturnType<typeof setTimeout>;
    observers: Set<QueryObserver>;
    cache: QueryCache;

    constructor(config: {
        cache: QueryCache;
        queryKey: QueryKey;
        queryHash: string;
        options?: QueryOptions<TData, TError>;
    }) {
        this.cache = config.cache;
        this.queryKey = config.queryKey;
        this.queryHash = config.queryHash;
        this.options = config.options || { queryKey: config.queryKey };
        this.observers = new Set();
        this.state = config.options?.initialData
            ? {
                  data: config.options.initialData,
                  dataUpdateCount: 1,
                  dataUpdatedAt: Date.now(),
                  error: null,
                  errorUpdateCount: 0,
                  errorUpdatedAt: 0,
                  fetchFailureCount: 0,
                  fetchFailureReason: null,
                  fetchMeta: null,
                  isInvalidated: false,
                  status: 'success',
                  fetchStatus: 'idle',
              }
            : {
                  data: undefined,
                  dataUpdateCount: 0,
                  dataUpdatedAt: 0,
                  error: null,
                  errorUpdateCount: 0,
                  errorUpdatedAt: 0,
                  fetchFailureCount: 0,
                  fetchFailureReason: null,
                  fetchMeta: null,
                  isInvalidated: false,
                  status: 'pending',
                  fetchStatus: 'idle',
              };
    }

    setOptions(options?: QueryOptions<TData, TError>) {
        this.options = { ...this.options, ...options };
        this.updateGcTimer();
    }

    protected updateGcTimer() {
        if (this.observers.size > 0) {
            this.clearGcTimer();
            return;
        }

        const gcTime = this.options.gcTime ?? 5 * 60 * 1000; // Default 5 mins

        this.clearGcTimer();

        if (gcTime === Infinity) return;

        this.gcTimeout = setTimeout(() => {
            this.scheduleGc();
        }, gcTime);
    }

    protected clearGcTimer() {
        if (this.gcTimeout) {
            clearTimeout(this.gcTimeout);
            this.gcTimeout = undefined;
        }
    }

    protected scheduleGc() {
        this.cache.remove(this);
    }

    addObserver(observer: QueryObserver) {
        this.observers.add(observer);
        this.clearGcTimer();
    }

    removeObserver(observer: QueryObserver) {
        this.observers.delete(observer);
        if (this.observers.size === 0) {
            this.updateGcTimer();
        }
    }

    isActive() {
        return this.observers.size > 0;
    }

    async fetch(options?: QueryOptions<TData, TError>): Promise<TData> {
        this.options = { ...this.options, ...options };

        if (this.state.fetchStatus !== 'idle') {
            if (this.state.data !== undefined && !this.isStale()) {
                return this.state.data;
            }
            // If fetching but stale (e.g. invalidation happened during fetch? rare),
            // usually we just join the promise.
            // But if we are re-fetching, we might want to wait for the ongoing fetch.
            // For now, if fetching, join the promise.
        }

        if (this.state.data !== undefined && !this.isStale()) {
            return this.state.data;
        }

        this.options = { ...this.options, ...options };

        // If we are already fetching, return the existing promise
        if (this.promise) {
            return this.promise;
        }

        this.updateState({ fetchStatus: 'fetching' });

        const queryFn = this.options.queryFn;
        if (!queryFn) {
            return Promise.reject(new Error(`Missing queryFn for queryKey: ${this.queryHash}`));
        }

        this.promise = (async () => {
            try {
                const data = await queryFn({ queryKey: this.queryKey });
                this.setData(data);
                return data;
            } catch (error) {
                this.setState({
                    status: 'error',
                    fetchStatus: 'idle',
                    error: error as TError,
                    errorUpdateCount: this.state.errorUpdateCount + 1,
                    errorUpdatedAt: Date.now(),
                    fetchFailureCount: this.state.fetchFailureCount + 1,
                    fetchFailureReason: error as TError,
                });
                throw error;
            } finally {
                this.promise = undefined;
            }
        })();

        return this.promise;
    }

    setData(data: TData) {
        this.setState({
            data,
            dataUpdateCount: this.state.dataUpdateCount + 1,
            dataUpdatedAt: Date.now(),
            error: null,
            status: 'success',
            fetchStatus: 'idle',
            fetchFailureCount: 0,
            fetchFailureReason: null,
            isInvalidated: false,
        });
    }

    setState(state: Partial<QueryState<TData, TError>>) {
        this.state = { ...this.state, ...state };
        this.notify();
    }

    updateState(state: Partial<QueryState<TData, TError>>) {
        this.state = { ...this.state, ...state };
        this.notify();
    }

    invalidate() {
        this.updateState({ isInvalidated: true });
    }

    isStale(): boolean {
        if (this.state.isInvalidated) return true;
        if (this.state.data === undefined) return true;

        const staleTime = this.options.staleTime ?? 0;
        const age = Date.now() - this.state.dataUpdatedAt;

        return age >= staleTime;
    }

    isFetching(): boolean {
        return this.state.fetchStatus === 'fetching';
    }

    notify() {
        this.observers.forEach((observer) => observer.onStateUpdate(this.state));
    }
}
