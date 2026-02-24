/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useQuery as tanstack_useQuery, useMutation } from '@tanstack/react-query';
import type {
    DefaultError,
    MutateFunction,
    QueryKey,
    UseMutationOptions,
    UseMutationResult,
    UseQueryOptions,
    UseQueryResult,
} from '@tanstack/react-query';
import type { Compute, ExactPartial, UnionStrictOmit } from '@ton/appkit';

export { useMutation };

export type UseMutationParameters<data = unknown, error = Error, variables = void, context = unknown> = Compute<
    Omit<UseMutationOptions<data, error, Compute<variables>, context>, 'mutationFn' | 'mutationKey' | 'throwOnError'>
>;

export type UseMutationReturnType<
    data = unknown,
    error = Error,
    variables = void,
    context = unknown,
    mutate = MutateFunction,
    mutateAsync = MutateFunction,
> = Compute<
    UnionStrictOmit<UseMutationResult<data, error, variables, context>, 'mutate' | 'mutateAsync'> & {
        mutate: mutate;
        mutateAsync: mutateAsync;
    }
>;

export function useQuery<queryFnData, error, data, queryKey extends QueryKey>(
    parameters: UseQueryParameters<queryFnData, error, data, queryKey> & {
        queryKey: QueryKey;
    },
): UseQueryReturnType<data, error> {
    const result = tanstack_useQuery({
        ...parameters,
        // queryKeyHashFn: hashFn, // for bigint support
    }) as UseQueryReturnType<data, error>;
    result.queryKey = parameters.queryKey;
    return result;
}

export type UseQueryParameters<
    queryFnData = unknown,
    error = DefaultError,
    data = queryFnData,
    queryKey extends QueryKey = QueryKey,
> = Compute<
    ExactPartial<Omit<UseQueryOptions<queryFnData, error, data, queryKey>, 'initialData'>> & {
        initialData?: UseQueryOptions<queryFnData, error, data, queryKey>['initialData'] | undefined;
    }
>;

export type UseQueryReturnType<data = unknown, error = DefaultError> = Compute<
    UseQueryResult<data, error> & {
        queryKey: QueryKey;
    }
>;
