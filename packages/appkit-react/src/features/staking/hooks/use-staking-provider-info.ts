/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStakingProviderInfoQueryOptions } from '@ton/appkit/queries';
import type {
    GetStakingProviderInfoData,
    GetStakingProviderInfoErrorType,
    GetStakingProviderInfoQueryConfig,
} from '@ton/appkit/queries';

import { useAppKit } from '../../../hooks/use-app-kit';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';

export type UseStakingProviderInfoParameters<selectData = GetStakingProviderInfoData> =
    GetStakingProviderInfoQueryConfig<selectData>;
export type UseStakingProviderInfoReturnType<selectData = GetStakingProviderInfoData> = UseQueryReturnType<
    selectData,
    GetStakingProviderInfoErrorType
>;

/**
 * Hook to get staking provider information
 */
export const useStakingProviderInfo = <selectData = GetStakingProviderInfoData>(
    parameters: UseStakingProviderInfoParameters<selectData> = {},
): UseStakingProviderInfoReturnType<selectData> => {
    const appKit = useAppKit();
    return useQuery(getStakingProviderInfoQueryOptions(appKit, parameters));
};
