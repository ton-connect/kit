/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getNFTsQueryOptions } from '@ton/appkit/queries';
import type { GetNFTsData, GetNFTsErrorType, GetNFTsQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';
import { useNetwork } from '../../network';

export type UseNFTsByAddressParameters<selectData = GetNFTsData> = GetNFTsQueryConfig<selectData>;

export type UseNFTsByAddressReturnType<selectData = GetNFTsData> = UseQueryReturnType<selectData, GetNFTsErrorType>;

/**
 * Hook to get NFTs
 */
export const useNftsByAddress = <selectData = GetNFTsData>(
    parameters: UseNFTsByAddressParameters<selectData> = {},
): UseNFTsByAddressReturnType<selectData> => {
    const appKit = useAppKit();
    const walletNetwork = useNetwork();

    return useQuery(getNFTsQueryOptions(appKit, { ...parameters, network: parameters.network ?? walletNetwork }));
};
