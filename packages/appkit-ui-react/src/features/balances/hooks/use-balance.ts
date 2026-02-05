/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getBalanceQueryOptions } from '@ton/appkit/queries';
import type { GetBalanceData, GetBalanceErrorType, GetBalanceQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../../hooks/use-app-kit';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';

export type UseBalanceParameters<selectData = GetBalanceData> = GetBalanceQueryConfig<selectData>;

export type UseBalanceReturnType<selectData = GetBalanceData> = UseQueryReturnType<selectData, GetBalanceErrorType>;

/**
 * Hook to get balance
 */
export const useBalance = <selectData = GetBalanceData>(
    parameters: UseBalanceParameters<selectData> = {},
): UseBalanceReturnType<selectData> => {
    const appKit = useAppKit();
    const options = getBalanceQueryOptions(appKit, parameters);

    return useQuery(options);
};
