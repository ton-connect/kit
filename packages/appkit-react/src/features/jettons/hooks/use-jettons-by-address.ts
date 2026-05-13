/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getJettonsByAddressQueryOptions } from '@ton/appkit/queries';
import type { GetJettonsByAddressData, GetJettonsErrorType, GetJettonsByAddressQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';
import { useNetwork } from '../../network';

/**
 * Parameters accepted by {@link useJettonsByAddress} — TanStack Query options (`select`, `enabled`, `staleTime`, …) plus the owner address, optional network override and pagination.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export type UseJettonsByAddressParameters<selectData = GetJettonsByAddressData> =
    GetJettonsByAddressQueryConfig<selectData>;

/**
 * Return type of {@link useJettonsByAddress} — TanStack Query result carrying `data`, `isLoading`, `error` and the standard companions.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export type UseJettonsByAddressReturnType<selectData = GetJettonsByAddressData> = UseQueryReturnType<
    selectData,
    GetJettonsErrorType
>;

/**
 * React hook listing jettons held by an arbitrary address through TanStack Query — useful for wallets that aren't selected in AppKit (use {@link useJettons} for the selected wallet).
 *
 * @param parameters - {@link UseJettonsByAddressParameters} Owner address, optional network override, pagination and TanStack Query overrides.
 * @expand parameters
 * @returns TanStack Query result for the jettons list.
 *
 * @sample docs/examples/src/appkit/hooks/jettons#USE_JETTONS_BY_ADDRESS
 *
 * @public
 * @category Hook
 * @section Jettons
 */
export const useJettonsByAddress = <selectData = GetJettonsByAddressData>(
    parameters: UseJettonsByAddressParameters<selectData> = {},
): UseJettonsByAddressReturnType<selectData> => {
    const appKit = useAppKit();
    const walletNetwork = useNetwork();

    return useQuery(
        getJettonsByAddressQueryOptions(appKit, { ...parameters, network: parameters.network ?? walletNetwork }),
    );
};
