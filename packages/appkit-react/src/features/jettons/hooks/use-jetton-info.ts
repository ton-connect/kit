/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getJettonInfoQueryOptions } from '@ton/appkit/queries';
import type { GetJettonInfoData, GetJettonInfoErrorType, GetJettonInfoQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';
import { useNetwork } from '../../network';

export type UseJettonInfoParameters<selectData = GetJettonInfoData> = GetJettonInfoQueryConfig<selectData>;

export type UseJettonInfoReturnType<selectData = GetJettonInfoData> = UseQueryReturnType<
    selectData,
    GetJettonInfoErrorType
>;

/**
 * Hook to get jetton info by address
 */
export const useJettonInfo = <selectData = GetJettonInfoData>(
    parameters: UseJettonInfoParameters<selectData> = {},
): UseJettonInfoReturnType<selectData> => {
    const appKit = useAppKit();
    const walletNetwork = useNetwork();

    return useQuery(getJettonInfoQueryOptions(appKit, { ...parameters, network: parameters.network ?? walletNetwork }));
};
