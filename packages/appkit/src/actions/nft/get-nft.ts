/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';

import type { AppKit } from '../../core/app-kit';
import type { Network } from '../../types/network';
import type { NFT } from '../../types/nft';
import type { UserFriendlyAddress } from '../../types/primitives';
import { getNftFromClient } from '../../utils';
import { resolveNetwork } from '../../utils/network/resolve-network';

/**
 * Options for {@link getNft}.
 *
 * @public
 * @category Type
 * @section NFTs
 */
export interface GetNftOptions {
    /** NFT contract address — pass a {@link UserFriendlyAddress} string or an `Address` instance from `@ton/core`. */
    address: UserFriendlyAddress | Address;
    /** Network to query. Defaults to the selected wallet's network; if no wallet is selected, falls back to AppKit's default network, or mainnet when none is set. */
    network?: Network;
}

/**
 * Return type of {@link getNft} — `null` when the indexer has no record for that address.
 *
 * @public
 * @category Type
 * @section NFTs
 */
export type GetNftReturnType = NFT | null;

/**
 * Fetch metadata and ownership for a single NFT by its contract address; returns `null` when the indexer has no record.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link GetNftOptions} NFT address and optional network override.
 * @returns NFT data, or `null` if the indexer has no record.
 *
 * @sample docs/examples/src/appkit/actions/nft#GET_NFT
 * @expand options
 *
 * @public
 * @category Action
 * @section NFTs
 */
export const getNft = async (appKit: AppKit, options: GetNftOptions): Promise<GetNftReturnType> => {
    const { address, network } = options;
    const addressString = Address.isAddress(address) ? address.toString() : Address.parse(address).toString();

    const client = appKit.networkManager.getClient(resolveNetwork(appKit, network));

    return getNftFromClient(client, addressString);
};
