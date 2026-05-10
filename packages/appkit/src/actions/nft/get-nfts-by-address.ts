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
import type { NFTsResponse } from '../../types/nft';
import type { UserFriendlyAddress } from '../../types/primitives';
import { getNftsFromClient } from '../../utils';
import { resolveNetwork } from '../../utils/network/resolve-network';

/**
 * Options for {@link getNftsByAddress}.
 *
 * @public
 * @category Type
 * @section NFTs
 */
export interface GetNftsByAddressOptions {
    /** Owner address — pass a {@link UserFriendlyAddress} string or an `Address` instance from `@ton/core`. */
    address: UserFriendlyAddress | Address;
    /** Network to read NFTs from. Defaults to the selected wallet's network; if no wallet is selected, falls back to AppKit's default network, or mainnet when none is set. */
    network?: Network;
    /** Maximum number of NFTs to return. */
    limit?: number;
    /** Number of NFTs to skip before returning results — used for pagination. */
    offset?: number;
}

/**
 * Return type of {@link getNftsByAddress}.
 *
 * @public
 * @category Type
 * @section NFTs
 */
export type GetNftsByAddressReturnType = NFTsResponse;

/**
 * List NFTs held by an arbitrary address — useful for inspecting wallets that aren't selected in AppKit (use {@link getNfts} for the selected wallet).
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link GetNftsByAddressOptions} Owner address, optional network override and pagination.
 * @returns NFTs response with the owner's items.
 *
 * @sample docs/examples/src/appkit/actions/nft#GET_NFTS_BY_ADDRESS
 * @expand options
 *
 * @public
 * @category Action
 * @section NFTs
 */
export const getNftsByAddress = async (
    appKit: AppKit,
    options: GetNftsByAddressOptions,
): Promise<GetNftsByAddressReturnType> => {
    const { address, network, limit, offset } = options;
    const addressString = Address.isAddress(address) ? address.toString() : Address.parse(address).toString();

    const client = appKit.networkManager.getClient(resolveNetwork(appKit, network));

    return getNftsFromClient(client, addressString, {
        pagination: {
            limit,
            offset,
        },
    });
};
