/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getNFTsQueryOptions } from '@ton/appkit/queries';
import type { GetNFTsData, GetNFTsErrorType, GetNFTsQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';
import { useNetwork } from '../../network';

/**
 * Parameters accepted by {@link useNftsByAddress} — TanStack Query options (`select`, `enabled`, `staleTime`, …) plus the owner address, optional pagination (`limit`, `offset`) and network override.
 *
 * The `network` field defaults to the selected wallet's network. If no wallet is selected, falls back to AppKit's default network, or mainnet when none is set.
 *
 * @public
 * @category Type
 * @section NFTs
 */
export type UseNFTsByAddressParameters<selectData = GetNFTsData> = GetNFTsQueryConfig<selectData>;

/**
 * Return type of {@link useNftsByAddress} — TanStack Query result carrying `data`, `isLoading`, `error` and the standard companions.
 *
 * @public
 * @category Type
 * @section NFTs
 */
export type UseNFTsByAddressReturnType<selectData = GetNFTsData> = UseQueryReturnType<selectData, GetNFTsErrorType>;

/**
 * React hook that reads NFTs held by an arbitrary address through TanStack Query — useful for wallets that aren't selected in AppKit (use {@link useNfts} for the selected wallet).
 *
 * @param parameters - {@link UseNFTsByAddressParameters} Owner address, optional pagination and network override, plus TanStack Query overrides.
 * @expand parameters
 * @returns TanStack Query result for the NFTs read.
 *
 * @sample docs/examples/src/appkit/hooks/nft#USE_NFTS_BY_ADDRESS
 *
 * @public
 * @category Hook
 * @section NFTs
 */
export const useNftsByAddress = <selectData = GetNFTsData>(
    parameters: UseNFTsByAddressParameters<selectData> = {},
): UseNFTsByAddressReturnType<selectData> => {
    const appKit = useAppKit();
    const walletNetwork = useNetwork();

    return useQuery(getNFTsQueryOptions(appKit, { ...parameters, network: parameters.network ?? walletNetwork }));
};
