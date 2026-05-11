/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getJettonInfoQueryOptions } from '@ton/appkit/queries';
import type { GetJettonInfoData, GetJettonInfoErrorType, GetJettonInfoQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';
import { useNetwork } from '../../network';

/**
 * Parameters accepted by {@link useJettonInfo} — TanStack Query options (`select`, `enabled`, `staleTime`, …) plus the jetton master address and optional network override.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export type UseJettonInfoParameters<selectData = GetJettonInfoData> = GetJettonInfoQueryConfig<selectData>;

/**
 * Return type of {@link useJettonInfo} — TanStack Query result carrying `data`, `isLoading`, `error` and the standard companions; `data` is `null` when the indexer has no record for that master address.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export type UseJettonInfoReturnType<selectData = GetJettonInfoData> = UseQueryReturnType<
    selectData,
    GetJettonInfoErrorType
>;

/**
 * React hook reading jetton-master metadata (name, symbol, decimals, image, description) through TanStack Query.
 *
 * @param parameters - {@link UseJettonInfoParameters} Jetton master address, optional network override and TanStack Query overrides.
 * @returns TanStack Query result for the jetton info read.
 *
 * @sample docs/examples/src/appkit/hooks/jettons#USE_JETTON_INFO
 *
 * @public
 * @category Hook
 * @section Jettons
 */
export const useJettonInfo = <selectData = GetJettonInfoData>(
    parameters: UseJettonInfoParameters<selectData> = {},
): UseJettonInfoReturnType<selectData> => {
    const appKit = useAppKit();
    const walletNetwork = useNetwork();

    return useQuery(getJettonInfoQueryOptions(appKit, { ...parameters, network: parameters.network ?? walletNetwork }));
};
