/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { Network } from '../../types/network';
import type { NFTsResponse } from '../../types/nft';
import { getSelectedWallet } from '../wallets/get-selected-wallet';
import { getNftsByAddress } from './get-nfts-by-address';

/**
 * Options for {@link getNfts}.
 *
 * @public
 * @category Type
 * @section NFTs
 */
export interface GetNftsOptions {
    /** Network to read NFTs from. Defaults to the selected wallet's network. */
    network?: Network;
    /** Maximum number of NFTs to return. */
    limit?: number;
    /** Number of NFTs to skip before returning results — used for pagination. */
    offset?: number;
}

/**
 * Return type of {@link getNfts} — `null` when no wallet is currently selected.
 *
 * @public
 * @category Type
 * @section NFTs
 */
export type GetNftsReturnType = NFTsResponse | null;

/**
 * List NFTs held by the currently selected wallet, returning `null` when no wallet is selected (use {@link getNftsByAddress} for an arbitrary address).
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link GetNftsOptions} Optional network override and pagination.
 * @returns NFTs response for the selected wallet, or `null` when none is selected.
 *
 * @sample docs/examples/src/appkit/actions/nft#GET_NFTS
 * @expand options
 *
 * @public
 * @category Action
 * @section NFTs
 */
export const getNfts = async (appKit: AppKit, options: GetNftsOptions = {}): Promise<GetNftsReturnType> => {
    const selectedWallet = getSelectedWallet(appKit);

    if (!selectedWallet) {
        return null;
    }

    return getNftsByAddress(appKit, {
        address: selectedWallet.getAddress(),
        network: options.network,
        limit: options.limit,
        offset: options.offset,
    });
};
