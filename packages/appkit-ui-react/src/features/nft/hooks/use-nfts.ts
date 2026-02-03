/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getNFTsQueryOptions } from '@ton/appkit/queries';
import type { GetNFTsData, GetNFTsErrorType, GetNFTsOptions } from '@ton/appkit/queries';

import { useAppKit } from '../../../hooks/use-app-kit';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';

export type UseNFTsParameters<selectData = GetNFTsData> = GetNFTsOptions<selectData>;

export type UseNFTsReturnType<selectData = GetNFTsData> = UseQueryReturnType<selectData, GetNFTsErrorType>;

/**
 * Hook to get NFTs
 */
export function useNFTs<selectData = GetNFTsData>(
    parameters: UseNFTsParameters<selectData> = {},
): UseNFTsReturnType<selectData> {
    const appKit = useAppKit();
    const options = getNFTsQueryOptions(appKit, parameters);

    return useQuery(options);
}
