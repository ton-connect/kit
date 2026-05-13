/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type * as Query from '@tanstack/query-core';

import type { Compute, LooseOmit, RequiredBy, UnionLooseOmit } from './utils.js';

/**
 * TanStack Query `useMutation` options forwarded by AppKit's `use*Mutation` hooks via `parameters.mutation` — `mutationFn`, `mutationKey` and `throwOnError` are managed by the wrapper and stripped from this shape.
 *
 * @public
 * @category Type
 * @section Primitives
 */
export type MutationOptionsOverride<data = unknown, error = Error, variables = void, context = unknown> = LooseOmit<
    Query.MutationOptions<data, error, Compute<variables>, context>,
    'mutationFn' | 'mutationKey' | 'throwOnError'
>;

export type MutationParameter<data = unknown, error = Error, variables = void, context = unknown> = {
    /** {@link MutationOptionsOverride} TanStack Query mutation options forwarded to `useMutation` (`onSuccess`, `onError`, `onMutate`, `retry`, …). `mutationFn`, `mutationKey` and `throwOnError` are managed by the wrapper. */
    mutation?: MutationOptionsOverride<data, error, variables, context> | undefined;
};

/**
 * TanStack Query `useQuery` options forwarded by AppKit's `use*Query` hooks via `parameters.query` — `queryKey` and `queryFn` are managed by the wrapper and stripped from this shape.
 *
 * @public
 * @category Type
 * @section Primitives
 */
export type QueryOptionsOverride<
    queryFnData = unknown,
    error = Query.DefaultError,
    data = queryFnData,
    queryKey extends Query.QueryKey = Query.QueryKey,
> = UnionLooseOmit<QueryOptions<queryFnData, error, data, queryKey>, 'queryKey' | 'queryFn'>;

export type QueryParameter<
    queryFnData = unknown,
    error = Query.DefaultError,
    data = queryFnData,
    queryKey extends Query.QueryKey = Query.QueryKey,
> = {
    /** {@link QueryOptionsOverride} TanStack Query options forwarded to `useQuery` (`enabled`, `staleTime`, `refetchInterval`, `select`, …). `queryKey` and `queryFn` are managed by the wrapper. */
    query?: QueryOptionsOverride<queryFnData, error, data, queryKey> | undefined;
};

export type QueryOptions<
    queryFnData = unknown,
    error = Query.DefaultError,
    data = queryFnData,
    queryKey extends Query.QueryKey = Query.QueryKey,
> = Omit<
    RequiredBy<Query.QueryObserverOptions<queryFnData, error, data, queryFnData, queryKey>, 'queryKey'>,
    'queryFn' | 'queryHash' | 'queryKeyHashFn' | 'throwOnError'
> & {
    queryFn: Exclude<
        Query.QueryObserverOptions<queryFnData, error, data, queryFnData, queryKey>['queryFn'],
        typeof Query.skipToken | undefined
    >;
};
