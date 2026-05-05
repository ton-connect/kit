/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { QueryClient } from '@tanstack/query-core';

import type { AppKit } from '../../core/app-kit';
import { getBalanceByAddress } from '../../actions/balances/get-balance-by-address';
import type { GetBalanceByAddressOptions } from '../../actions/balances/get-balance-by-address';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute, ExactPartial } from '../../types/utils';
import { filterQueryOptions, resolveNetwork, sleep } from '../../utils';
import type { GetBalanceByAddressReturnType } from '../../actions/balances/get-balance-by-address';
import type { BalanceUpdate } from '../../core/streaming';
import type { Network } from '../../types/network';

export type GetBalanceErrorType = Error;

export type GetBalanceByAddressData = GetBalanceQueryFnData;

export type GetBalanceByAddressQueryConfig<selectData = GetBalanceByAddressData> = Compute<
    ExactPartial<GetBalanceByAddressOptions>
> &
    QueryParameter<GetBalanceQueryFnData, GetBalanceErrorType, selectData, GetBalanceByAddressQueryKey>;

export const getBalanceByAddressQueryOptions = <selectData = GetBalanceByAddressData>(
    appKit: AppKit,
    initialOptions: GetBalanceByAddressQueryConfig<selectData> = {},
): GetBalanceByAddressQueryOptions<selectData> => {
    const network = resolveNetwork(appKit, initialOptions.network);
    const options = { ...initialOptions, network };

    return {
        ...options.query,
        enabled: Boolean(options.address && (options.query?.enabled ?? true)),
        queryFn: async (context) => {
            const [, parameters] = context.queryKey as [string, GetBalanceByAddressOptions];
            if (!parameters.address) throw new Error('address is required');
            const balance = await getBalanceByAddress(appKit, parameters);
            return balance ?? null;
        },
        queryKey: getBalanceByAddressQueryKey(options),
    };
};

export type GetBalanceQueryFnData = Compute<Awaited<GetBalanceByAddressReturnType>>;

export const getBalanceByAddressQueryKey = (
    options: Compute<ExactPartial<GetBalanceByAddressOptions>> = {},
): GetBalanceByAddressQueryKey => {
    return ['balance', filterQueryOptions(options)] as const;
};

export type GetBalanceByAddressQueryKey = readonly ['balance', Compute<ExactPartial<GetBalanceByAddressOptions>>];

export type GetBalanceByAddressQueryOptions<selectData = GetBalanceByAddressData> = QueryOptions<
    GetBalanceQueryFnData,
    GetBalanceErrorType,
    selectData,
    GetBalanceByAddressQueryKey
>;

/**
 * Update the TanStack Query cache for an address balance.
 */
export const handleBalanceUpdate = (
    queryClient: QueryClient,
    { address, network }: { address: string; network: Network },
    update: BalanceUpdate,
) => {
    if (update.status === 'finalized') {
        const queryKey = getBalanceByAddressQueryKey({ address, network });
        queryClient.setQueryData(queryKey, update.balance);
        sleep(5000).then(() => queryClient.invalidateQueries({ queryKey }));
    }

    if (update.status === 'invalidated') {
        const queryKey = getBalanceByAddressQueryKey({ address, network });
        queryClient.invalidateQueries({ queryKey });
    }
};
