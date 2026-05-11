/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getNftQueryOptions } from '@ton/appkit/queries';
import type { GetNftData, GetNftErrorType, GetNftQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';
import { useNetwork } from '../../network';

/**
 * Parameters accepted by {@link useNft} — TanStack Query options (`select`, `enabled`, `staleTime`, …) plus the NFT contract address and optional network override.
 *
 * The `network` field defaults to the selected wallet's network; if no wallet is selected, falls back to AppKit's default network, or mainnet when none is set.
 *
 * @public
 * @category Type
 * @section NFTs
 */
export type UseNftParameters<selectData = GetNftData> = GetNftQueryConfig<selectData>;

/**
 * Return type of {@link useNft} — TanStack Query result carrying `data` (the NFT or `null` when the indexer has no record), `isLoading`, `error` and the standard companions.
 *
 * @public
 * @category Type
 * @section NFTs
 */
export type UseNftReturnType<selectData = GetNftData> = UseQueryReturnType<selectData, GetNftErrorType>;

/**
 * React hook reading metadata and ownership for a single NFT through TanStack Query, keyed by its contract address; `data` is `null` when the indexer has no record.
 *
 * @param parameters - {@link UseNftParameters} NFT address, optional network override, and TanStack Query overrides.
 * @returns TanStack Query result for the NFT read.
 *
 * @sample docs/examples/src/appkit/hooks/nft#USE_NFT
 *
 * @public
 * @category Hook
 * @section NFTs
 */
export const useNft = <selectData = GetNftData>(
    parameters: UseNftParameters<selectData> = {},
): UseNftReturnType<selectData> => {
    const appKit = useAppKit();
    const walletNetwork = useNetwork();

    return useQuery(getNftQueryOptions(appKit, { ...parameters, network: parameters.network ?? walletNetwork }));
};
