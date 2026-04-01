/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStakingProvidersQueryOptions } from '@ton/appkit/queries';
import type {
    GetStakingProvidersData,
    GetStakingProvidersErrorType,
    GetStakingProvidersQueryConfig,
} from '@ton/appkit/queries';

import { useAppKit } from '../../../hooks/use-app-kit';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';

export type UseStakingProvidersParameters<selectData = GetStakingProvidersData> =
    GetStakingProvidersQueryConfig<selectData>;
export type UseStakingProvidersReturnType<selectData = GetStakingProvidersData> = UseQueryReturnType<
    selectData,
    GetStakingProvidersErrorType
>;

/**
 * Hook to get available staking provider IDs
 */
export const useStakingProviders = <selectData = GetStakingProvidersData>(
    parameters: UseStakingProvidersParameters<selectData> = {},
): UseStakingProvidersReturnType<selectData> => {
    const appKit = useAppKit();
    return useQuery(getStakingProvidersQueryOptions(appKit, parameters));
};
