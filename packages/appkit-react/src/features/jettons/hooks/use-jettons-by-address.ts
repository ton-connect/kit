/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getJettonsByAddressQueryOptions } from '@ton/appkit/queries';
import type { GetJettonsByAddressData, GetJettonsErrorType, GetJettonsByAddressQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';
import { useNetwork } from '../../network';

export type UseJettonsByAddressParameters<selectData = GetJettonsByAddressData> =
    GetJettonsByAddressQueryConfig<selectData>;

export type UseJettonsByAddressReturnType<selectData = GetJettonsByAddressData> = UseQueryReturnType<
    selectData,
    GetJettonsErrorType
>;

/**
 * Hook to get jettons
 */
export const useJettonsByAddress = <selectData = GetJettonsByAddressData>(
    parameters: UseJettonsByAddressParameters<selectData> = {},
): UseJettonsByAddressReturnType<selectData> => {
    const appKit = useAppKit();
    const walletNetwork = useNetwork();

    return useQuery(
        getJettonsByAddressQueryOptions(appKit, { ...parameters, network: parameters.network ?? walletNetwork }),
    );
};
