/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export type QueryKey = string | readonly unknown[];

export type QueryFunction<T = unknown> = (context: { queryKey: QueryKey; signal?: AbortSignal }) => T | Promise<T>;

export type QueryStatus = 'pending' | 'error' | 'success';
export type FetchStatus = 'fetching' | 'paused' | 'idle';

export interface QueryState<TData = unknown, TError = unknown> {
    data: TData | undefined;
    dataUpdateCount: number;
    dataUpdatedAt: number;
    error: TError | null;
    errorUpdateCount: number;
    errorUpdatedAt: number;
    fetchFailureCount: number;
    fetchFailureReason: TError | null;
    fetchMeta: unknown;
    isInvalidated: boolean;
    status: QueryStatus;
    fetchStatus: FetchStatus;
}

export interface QueryOptions<TData = unknown, _TError = unknown> {
    queryKey: QueryKey;
    queryFn?: QueryFunction<TData>;
    staleTime?: number;
    gcTime?: number;
    enabled?: boolean;
    initialData?: TData;
}

export interface QueryObserver {
    onStateUpdate(state: QueryState<unknown, unknown>): void;
}
