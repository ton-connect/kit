/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getJettonBalanceByAddressQueryOptions } from '@ton/appkit/queries';
import type {
    GetJettonBalanceByAddressData,
    GetJettonBalanceErrorType,
    GetJettonBalanceByAddressQueryConfig,
} from '@ton/appkit/queries';

import { useAppKit } from '../../../hooks/use-app-kit';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';

export type UseJettonBalanceByAddressParameters<selectData = GetJettonBalanceByAddressData> =
    GetJettonBalanceByAddressQueryConfig<selectData>;

export type UseJettonBalanceByAddressReturnType<selectData = GetJettonBalanceByAddressData> = UseQueryReturnType<
    selectData,
    GetJettonBalanceErrorType
>;

/**
 * Hook to get jetton balance
 */
export const useJettonBalanceByAddress = <selectData = GetJettonBalanceByAddressData>(
    parameters: UseJettonBalanceByAddressParameters<selectData> = {},
): UseJettonBalanceByAddressReturnType<selectData> => {
    const appKit = useAppKit();

    return useQuery(getJettonBalanceByAddressQueryOptions(appKit, parameters));
};
