/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getJettonBalanceQueryOptions } from '@ton/appkit/queries';
import type { GetJettonBalanceData, GetJettonBalanceErrorType, GetJettonBalanceQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../../hooks/use-app-kit';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';

export type UseJettonBalanceParameters<selectData = GetJettonBalanceData> = GetJettonBalanceQueryConfig<selectData>;

export type UseJettonBalanceReturnType<selectData = GetJettonBalanceData> = UseQueryReturnType<
    selectData,
    GetJettonBalanceErrorType
>;

/**
 * Hook to get jetton balance
 */
export const useJettonBalance = <selectData = GetJettonBalanceData>(
    parameters: UseJettonBalanceParameters<selectData> = {},
) => {
    const appKit = useAppKit();
    const options = getJettonBalanceQueryOptions(appKit, parameters);

    return useQuery(options);
};
