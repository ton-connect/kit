/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import { getCryptoOnrampStatus } from '../../actions/crypto-onramp/get-crypto-onramp-status';
import type {
    GetCryptoOnrampStatusOptions,
    GetCryptoOnrampStatusReturnType,
} from '../../actions/crypto-onramp/get-crypto-onramp-status';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute, ExactPartial } from '../../types/utils';
import { filterQueryOptions } from '../../utils';

export type GetCryptoOnrampStatusErrorType = Error;
export type GetCryptoOnrampStatusData = GetCryptoOnrampStatusQueryFnData;
export type GetCryptoOnrampStatusQueryConfig<selectData = GetCryptoOnrampStatusData> = Compute<
    ExactPartial<GetCryptoOnrampStatusOptions>
> &
    QueryParameter<
        GetCryptoOnrampStatusQueryFnData,
        GetCryptoOnrampStatusErrorType,
        selectData,
        GetCryptoOnrampStatusQueryKey
    >;

export const getCryptoOnrampStatusQueryOptions = <selectData = GetCryptoOnrampStatusData>(
    appKit: AppKit,
    options: GetCryptoOnrampStatusQueryConfig<selectData> = {},
): GetCryptoOnrampStatusQueryOptions<selectData> => {
    return {
        ...options.query,
        queryFn: async (context) => {
            const [, parameters] = context.queryKey as [string, GetCryptoOnrampStatusOptions];
            return getCryptoOnrampStatus(appKit, parameters);
        },
        queryKey: getCryptoOnrampStatusQueryKey(options),
        enabled: options.depositId !== undefined,
    };
};

export type GetCryptoOnrampStatusQueryFnData = Compute<Awaited<GetCryptoOnrampStatusReturnType>>;
export const getCryptoOnrampStatusQueryKey = (
    options: Compute<ExactPartial<GetCryptoOnrampStatusOptions>> = {},
): GetCryptoOnrampStatusQueryKey => ['crypto-onramp-status', filterQueryOptions(options)] as const;
export type GetCryptoOnrampStatusQueryKey = readonly [
    'crypto-onramp-status',
    Compute<ExactPartial<GetCryptoOnrampStatusOptions>>,
];
export type GetCryptoOnrampStatusQueryOptions<selectData = GetCryptoOnrampStatusData> = QueryOptions<
    GetCryptoOnrampStatusQueryFnData,
    GetCryptoOnrampStatusErrorType,
    selectData,
    GetCryptoOnrampStatusQueryKey
>;
