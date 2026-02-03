/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NFTsResponse, Network } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { getNfts } from './get-nfts';

export interface GetNftsOfSelectedWalletOptions {
    network?: Network;
    limit?: number;
    offset?: number;
}

export async function getNftsOfSelectedWallet(
    appKit: AppKit,
    options: GetNftsOfSelectedWalletOptions = {},
): Promise<NFTsResponse | null> {
    const selectedWallet = appKit.walletsManager.selectedWallet;

    if (!selectedWallet) {
        return null;
    }

    return getNfts(appKit, {
        address: selectedWallet.getAddress(),
        network: options.network,
        limit: options.limit,
        offset: options.offset,
    });
}
