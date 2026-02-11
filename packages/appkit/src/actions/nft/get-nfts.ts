/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NFTsResponse, Network } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { getNftsByAddress } from './get-nfts-by-address';
import { getSelectedWallet } from '../wallets/get-selected-wallet';

export interface GetNftsOptions {
    network?: Network;
    limit?: number;
    offset?: number;
}

export type GetNftsReturnType = NFTsResponse | null;

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
