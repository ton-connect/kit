/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import { getCryptoOnrampStatusQueryOptions } from '@ton/appkit/queries';
import type {
    GetCryptoOnrampStatusData,
    GetCryptoOnrampStatusErrorType,
    GetCryptoOnrampStatusQueryConfig,
} from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';

export type UseCryptoOnrampStatusParameters<selectData = GetCryptoOnrampStatusData> =
    GetCryptoOnrampStatusQueryConfig<selectData>;

export type UseCryptoOnrampStatusReturnType<selectData = GetCryptoOnrampStatusData> = UseQueryReturnType<
    selectData,
    GetCryptoOnrampStatusErrorType
>;

/**
 * Hook to get a crypto onramp quote
 */
export const useCryptoOnrampStatus = <selectData = GetCryptoOnrampStatusData>(
    parameters: UseCryptoOnrampStatusParameters<selectData> = {},
): UseCryptoOnrampStatusReturnType<selectData> => {
    const appKit = useAppKit();

    return useQuery(getCryptoOnrampStatusQueryOptions(appKit, parameters));
};
