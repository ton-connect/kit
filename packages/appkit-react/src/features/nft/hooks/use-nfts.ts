/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { GetNFTsData } from '@ton/appkit/queries';

import { useAddress } from '../../wallets/hooks/use-address';
import { useNftsByAddress } from './use-nfts-by-address';
import type { UseNFTsByAddressParameters, UseNFTsByAddressReturnType } from './use-nfts-by-address';

/**
 * Parameters accepted by {@link useNfts} — same shape as {@link UseNFTsByAddressParameters}; the hook resolves `address` from the selected wallet and overrides any value supplied here.
 *
 * @public
 * @category Type
 * @section NFTs
 */
export type UseNFTsParameters<selectData = GetNFTsData> = UseNFTsByAddressParameters<selectData>;

/**
 * Return type of {@link useNfts} — TanStack Query result carrying `data`, `isLoading`, `error` and the standard companions.
 *
 * @public
 * @category Type
 * @section NFTs
 */
export type UseNFTsReturnType<selectData = GetNFTsData> = UseNFTsByAddressReturnType<selectData>;

/**
 * React hook that reads NFTs held by the currently selected wallet through TanStack Query — auto-resolves the wallet address (use {@link useNftsByAddress} for an arbitrary address).
 *
 * @param parameters - {@link UseNFTsParameters} Optional pagination, network override, and TanStack Query overrides.
 * @returns TanStack Query result for the NFTs read.
 *
 * @sample docs/examples/src/appkit/hooks/nft#USE_NFTS
 *
 * @public
 * @category Hook
 * @section NFTs
 */
export const useNfts = <selectData = GetNFTsData>(
    parameters: UseNFTsParameters<selectData> = {},
): UseNFTsReturnType<selectData> => {
    const address = useAddress();

    return useNftsByAddress({ ...parameters, address });
};
