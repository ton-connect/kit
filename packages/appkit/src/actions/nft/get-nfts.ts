/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';
import type { NFTsResponse } from '@ton/walletkit';
import { Network, getNftsFromClient } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';

export interface GetNftsOptions {
    address: string | Address;
    network?: Network;
    limit?: number;
    offset?: number;
}

export async function getNfts(appKit: AppKit, options: GetNftsOptions): Promise<NFTsResponse> {
    const { address, network, limit, offset } = options;
    const addressString = Address.isAddress(address) ? address.toString() : Address.parse(address).toString();

    const client = appKit.networkManager.getClient(network ?? Network.mainnet());

    return getNftsFromClient(client, addressString, {
        pagination: {
            limit,
            offset,
        },
    });
}
