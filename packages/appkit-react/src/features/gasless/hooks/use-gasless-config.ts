/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getGaslessConfigQueryOptions } from '@ton/appkit/queries';
import type { GetGaslessConfigData, GetGaslessConfigErrorType, GetGaslessConfigQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';

export type UseGaslessConfigParameters<selectData = GetGaslessConfigData> = GetGaslessConfigQueryConfig<selectData>;
export type UseGaslessConfigReturnType<selectData = GetGaslessConfigData> = UseQueryReturnType<
    selectData,
    GetGaslessConfigErrorType
>;

/**
 * Hook to get gasless relayer configuration.
 */
export const useGaslessConfig = <selectData = GetGaslessConfigData>(
    parameters: UseGaslessConfigParameters<selectData> = {},
): UseGaslessConfigReturnType<selectData> => {
    const appKit = useAppKit();

    return useQuery(getGaslessConfigQueryOptions(appKit, parameters));
};
