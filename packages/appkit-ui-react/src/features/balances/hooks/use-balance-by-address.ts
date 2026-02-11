/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getBalanceByAddressQueryOptions } from '@ton/appkit/queries';
import type { GetBalanceByAddressData, GetBalanceErrorType, GetBalanceByAddressQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../../hooks/use-app-kit';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';

export type UseBalanceByAddressParameters<selectData = GetBalanceByAddressData> =
    GetBalanceByAddressQueryConfig<selectData>;

export type UseBalanceByAddressReturnType<selectData = GetBalanceByAddressData> = UseQueryReturnType<
    selectData,
    GetBalanceErrorType
>;

/**
 * Hook to get balance
 */
export const useBalanceByAddress = <selectData = GetBalanceByAddressData>(
    parameters: UseBalanceByAddressParameters<selectData> = {},
): UseBalanceByAddressReturnType<selectData> => {
    const appKit = useAppKit();
    const options = getBalanceByAddressQueryOptions(appKit, parameters);

    return useQuery(options);
};
