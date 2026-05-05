/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { QueryClient } from '@tanstack/query-core';

import type { AppKit } from '../../core/app-kit';
import { getJettonsByAddress } from '../../actions/jettons/get-jettons-by-address';
import type { GetJettonsByAddressOptions } from '../../actions/jettons/get-jettons-by-address';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute, ExactPartial } from '../../types/utils';
import { filterQueryOptions, resolveNetwork, compareAddress, formatUnits, sleep } from '../../utils';
import type { GetJettonsByAddressReturnType } from '../../actions/jettons/get-jettons-by-address';
import type { JettonUpdate } from '../../core/streaming';
import type { Network } from '../../types/network';

export type GetJettonsErrorType = Error;

export type GetJettonsByAddressData = GetJettonsQueryFnData;

export type GetJettonsByAddressQueryConfig<selectData = GetJettonsByAddressData> = Compute<
    ExactPartial<GetJettonsByAddressOptions>
> &
    QueryParameter<GetJettonsQueryFnData, GetJettonsErrorType, selectData, GetJettonsByAddressQueryKey>;

export const getJettonsByAddressQueryOptions = <selectData = GetJettonsByAddressData>(
    appKit: AppKit,
    initialOptions: GetJettonsByAddressQueryConfig<selectData> = {},
): GetJettonsByAddressQueryOptions<selectData> => {
    const network = resolveNetwork(appKit, initialOptions.network);
    const options = { ...initialOptions, network };

    return {
        ...options.query,
        enabled: Boolean(options.address && (options.query?.enabled ?? true)),
        queryFn: async (context) => {
            const [, parameters] = context.queryKey as [string, GetJettonsByAddressOptions];
            if (!parameters.address) throw new Error('address is required');

            const jettons = await getJettonsByAddress(appKit, parameters);
            return jettons;
        },
        queryKey: getJettonsByAddressQueryKey(options),
    };
};

export type GetJettonsQueryFnData = Compute<Awaited<GetJettonsByAddressReturnType>>;

export const getJettonsByAddressQueryKey = (
    options: Compute<ExactPartial<GetJettonsByAddressOptions>> = {},
): GetJettonsByAddressQueryKey => {
    return ['jettons', filterQueryOptions(options)] as const;
};

export type GetJettonsByAddressQueryKey = readonly ['jettons', Compute<ExactPartial<GetJettonsByAddressOptions>>];

export type GetJettonsByAddressQueryOptions<selectData = GetJettonsByAddressData> = QueryOptions<
    GetJettonsQueryFnData,
    GetJettonsErrorType,
    selectData,
    GetJettonsByAddressQueryKey
>;

/**
 * Update the TanStack Query cache for an address jettons list.
 */
export const handleJettonsUpdate = (
    queryClient: QueryClient,
    { address, network }: { address: string; network: Network },
    update: JettonUpdate,
) => {
    if (update.status === 'finalized') {
        const queryKey = getJettonsByAddressQueryKey({ address, network });
        const currentData = queryClient.getQueryData(queryKey) as GetJettonsByAddressData | undefined;

        if (currentData?.jettons) {
            const jetton = currentData.jettons.find((j) => compareAddress(j.address, update.masterAddress));
            const decimals = jetton?.decimalsNumber ?? update.decimals;

            if (jetton && decimals) {
                const updatedJetton = {
                    ...jetton,
                    balance: formatUnits(update.rawBalance, decimals),
                };
                const newJettons = currentData.jettons.map((j) =>
                    compareAddress(j.address, update.masterAddress) ? updatedJetton : j,
                );
                queryClient.setQueryData(queryKey, {
                    ...currentData,
                    jettons: newJettons,
                });
            }
        }
        sleep(5000).then(() => queryClient.invalidateQueries({ queryKey }));
    }

    if (update.status === 'invalidated') {
        const queryKey = getJettonsByAddressQueryKey({ address, network });
        queryClient.invalidateQueries({ queryKey });
    }
};
