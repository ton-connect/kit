/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStakedBalanceQueryOptions } from '@ton/appkit/queries';
import type { GetStakedBalanceData, GetStakedBalanceErrorType, GetStakedBalanceQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../../hooks/use-app-kit';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';

export type UseStakedBalanceParameters<selectData = GetStakedBalanceData> = GetStakedBalanceQueryConfig<selectData>;
export type UseStakedBalanceReturnType<selectData = GetStakedBalanceData> = UseQueryReturnType<
    selectData,
    GetStakedBalanceErrorType
>;

/**
 * Hook to get user's staked balance
 */
export const useStakedBalance = <selectData = GetStakedBalanceData>(
    parameters: UseStakedBalanceParameters<selectData> = {},
): UseStakedBalanceReturnType<selectData> => {
    const appKit = useAppKit();
    return useQuery(getStakedBalanceQueryOptions(appKit, parameters));
};
