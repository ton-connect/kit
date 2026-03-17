/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getBlockNumberQueryOptions } from '@ton/appkit/queries';
import type { GetBlockNumberData, GetBlockNumberErrorType, GetBlockNumberQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../../hooks/use-app-kit';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';

export type UseBlockNumberParameters<selectData = GetBlockNumberData> = GetBlockNumberQueryConfig<selectData>;

export type UseBlockNumberReturnType<selectData = GetBlockNumberData> = UseQueryReturnType<
    selectData,
    GetBlockNumberErrorType
>;

/**
 * Hook to get the current masterchain block number
 */
export const useBlockNumber = <selectData = GetBlockNumberData>(
    parameters: UseBlockNumberParameters<selectData> = {},
): UseBlockNumberReturnType<selectData> => {
    const appKit = useAppKit();

    return useQuery(getBlockNumberQueryOptions(appKit, parameters));
};
