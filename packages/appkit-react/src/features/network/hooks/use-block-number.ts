/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getBlockNumberQueryOptions } from '@ton/appkit/queries';
import type { GetBlockNumberData, GetBlockNumberErrorType, GetBlockNumberQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';
import { useNetwork } from '../hooks/use-network';

/**
 * Parameters accepted by {@link useBlockNumber} — TanStack Query options plus an optional network override (defaults to the selected wallet's network).
 *
 * @public
 * @category Type
 * @section Networks
 */
export type UseBlockNumberParameters<selectData = GetBlockNumberData> = GetBlockNumberQueryConfig<selectData>;

/**
 * Return type of {@link useBlockNumber} — TanStack Query result.
 *
 * @public
 * @category Type
 * @section Networks
 */
export type UseBlockNumberReturnType<selectData = GetBlockNumberData> = UseQueryReturnType<
    selectData,
    GetBlockNumberErrorType
>;

/**
 * React hook reading the latest masterchain seqno through TanStack Query — useful for freshness checks and pagination cursors.
 *
 * @param parameters - {@link UseBlockNumberParameters} TanStack Query overrides and optional network.
 * @returns TanStack Query result for the seqno read.
 *
 * @public
 * @category Hook
 * @section Networks
 */
export const useBlockNumber = <selectData = GetBlockNumberData>(
    parameters: UseBlockNumberParameters<selectData> = {},
): UseBlockNumberReturnType<selectData> => {
    const appKit = useAppKit();
    const walletNetwork = useNetwork();

    return useQuery(
        getBlockNumberQueryOptions(appKit, { ...parameters, network: parameters.network ?? walletNetwork }),
    );
};
