/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getJettonWalletAddressQueryOptions } from '@ton/appkit/queries';
import type {
    GetJettonWalletAddressData,
    GetJettonWalletAddressErrorType,
    GetJettonWalletAddressQueryConfig,
} from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';
import { useNetwork } from '../../network';

export type UseJettonWalletAddressParameters<selectData = GetJettonWalletAddressData> =
    GetJettonWalletAddressQueryConfig<selectData>;

export type UseJettonWalletAddressReturnType<selectData = GetJettonWalletAddressData> = UseQueryReturnType<
    selectData,
    GetJettonWalletAddressErrorType
>;

/**
 * Hook to get jetton wallet address
 */
export const useJettonWalletAddress = <selectData = GetJettonWalletAddressData>(
    parameters: UseJettonWalletAddressParameters<selectData> = {},
) => {
    const appKit = useAppKit();
    const walletNetwork = useNetwork();

    return useQuery(
        getJettonWalletAddressQueryOptions(appKit, { ...parameters, network: parameters.network ?? walletNetwork }),
    );
};
