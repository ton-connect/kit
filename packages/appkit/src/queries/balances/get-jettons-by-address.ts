/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { JettonsResponse } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { getJettonsByAddress } from '../../actions/balances/get-jettons-by-address';
import type { GetJettonsByAddressOptions } from '../../actions/balances/get-jettons-by-address';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute, ExactPartial } from '../../types/utils';
import { filterQueryOptions } from '../../utils';

export type GetJettonsErrorType = Error;

export type GetJettonsByAddressData = GetJettonsQueryFnData;

export type GetJettonsByAddressQueryConfig<selectData = GetJettonsByAddressData> = Compute<
    ExactPartial<GetJettonsByAddressOptions>
> &
    QueryParameter<GetJettonsQueryFnData, GetJettonsErrorType, selectData, GetJettonsByAddressQueryKey>;

export const getJettonsByAddressQueryOptions = <selectData = GetJettonsByAddressData>(
    appKit: AppKit,
    options: GetJettonsByAddressQueryConfig<selectData> = {},
): GetJettonsByAddressQueryOptions<selectData> => {
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

export type GetJettonsQueryFnData = Compute<JettonsResponse>;

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
