/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getNftQueryOptions } from '@ton/appkit/queries';
import type { GetNftData, GetNftErrorType, GetNftQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../../hooks/use-app-kit';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';

export type UseNftParameters<selectData = GetNftData> = GetNftQueryConfig<selectData>;

export type UseNftReturnType<selectData = GetNftData> = UseQueryReturnType<selectData, GetNftErrorType>;

/**
 * Hook to get a single NFT
 */
export const useNft = <selectData = GetNftData>(
    parameters: UseNftParameters<selectData> = {},
): UseNftReturnType<selectData> => {
    const appKit = useAppKit();

    return useQuery(getNftQueryOptions(appKit, parameters));
};
