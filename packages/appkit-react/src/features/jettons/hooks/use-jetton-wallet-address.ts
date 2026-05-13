/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getJettonWalletAddressQueryOptions } from '@ton/appkit/queries';
import type {
    GetJettonWalletAddressData,
    GetJettonWalletAddressErrorType,
    GetJettonWalletAddressQueryConfig,
} from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';
import { useNetwork } from '../../network';

/**
 * Parameters accepted by {@link useJettonWalletAddress} — TanStack Query options (`select`, `enabled`, `staleTime`, …) plus the jetton master, owner address and optional network override.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export type UseJettonWalletAddressParameters<selectData = GetJettonWalletAddressData> =
    GetJettonWalletAddressQueryConfig<selectData>;

/**
 * Return type of {@link useJettonWalletAddress} — TanStack Query result carrying `data`, `isLoading`, `error` and the standard companions.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export type UseJettonWalletAddressReturnType<selectData = GetJettonWalletAddressData> = UseQueryReturnType<
    selectData,
    GetJettonWalletAddressErrorType
>;

/**
 * React hook deriving the owner's jetton-wallet address — the per-owner contract that actually holds the jetton balance for a given master — through TanStack Query.
 *
 * @param parameters - {@link UseJettonWalletAddressParameters} Jetton master, owner address, optional network override and TanStack Query overrides.
 * @expand parameters
 * @returns TanStack Query result for the jetton-wallet address read.
 *
 * @sample docs/examples/src/appkit/hooks/jettons#USE_JETTON_WALLET_ADDRESS
 *
 * @public
 * @category Hook
 * @section Jettons
 */
export const useJettonWalletAddress = <selectData = GetJettonWalletAddressData>(
    parameters: UseJettonWalletAddressParameters<selectData> = {},
) => {
    const appKit = useAppKit();
    const walletNetwork = useNetwork();

    return useQuery(
        getJettonWalletAddressQueryOptions(appKit, { ...parameters, network: parameters.network ?? walletNetwork }),
    );
};
