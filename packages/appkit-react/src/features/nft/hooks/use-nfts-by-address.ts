/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getNFTsQueryOptions } from '@ton/appkit/queries';
import type { GetNFTsData, GetNFTsErrorType, GetNFTsQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../../hooks/use-app-kit';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';

export type UseNFTsByAddressParameters<selectData = GetNFTsData> = GetNFTsQueryConfig<selectData>;

export type UseNFTsByAddressReturnType<selectData = GetNFTsData> = UseQueryReturnType<selectData, GetNFTsErrorType>;

/**
 * Hook to get NFTs
 */
export const useNFTsByAddress = <selectData = GetNFTsData>(
    parameters: UseNFTsByAddressParameters<selectData> = {},
): UseNFTsByAddressReturnType<selectData> => {
    const appKit = useAppKit();

    return useQuery(getNFTsQueryOptions(appKit, parameters));
};
