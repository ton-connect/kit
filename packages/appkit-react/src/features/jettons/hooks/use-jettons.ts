/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { GetJettonsByAddressData } from '@ton/appkit/queries';

import { useAddress } from '../../wallets/hooks/use-address';
import { useJettonsByAddress } from './use-jettons-by-address';
import type { UseJettonsByAddressParameters, UseJettonsByAddressReturnType } from './use-jettons-by-address';

/**
 * Parameters accepted by {@link useJettons} — same shape as {@link UseJettonsByAddressParameters}; the hook resolves `address` from the selected wallet and overrides any value supplied here.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export type UseJettonsParameters<selectData = GetJettonsByAddressData> = UseJettonsByAddressParameters<selectData>;

/**
 * Return type of {@link useJettons} — TanStack Query result carrying `data`, `isLoading`, `error` and the standard companions.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export type UseJettonsReturnType<selectData = GetJettonsByAddressData> = UseJettonsByAddressReturnType<selectData>;

/**
 * React hook listing jettons held by the currently selected wallet through TanStack Query — auto-resolves the wallet address (use {@link useJettonsByAddress} for an arbitrary address).
 *
 * @param parameters - {@link UseJettonsParameters} TanStack Query overrides (`select`, `enabled`, `staleTime`, …), pagination and an optional network override.
 * @returns TanStack Query result for the jettons list.
 *
 * @sample docs/examples/src/appkit/hooks/jettons#USE_JETTONS
 *
 * @public
 * @category Hook
 * @section Jettons
 */
export const useJettons = <selectData = GetJettonsByAddressData>(
    parameters: UseJettonsParameters<selectData> = {},
): UseJettonsReturnType<selectData> => {
    const address = useAddress();

    return useJettonsByAddress({ ...parameters, address });
};
