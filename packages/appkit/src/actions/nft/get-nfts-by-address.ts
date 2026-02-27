/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';
import type { NFTsResponse, Network } from '@ton/walletkit';
import { getNftsFromClient } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { resolveNetwork } from '../../utils/network/resolve-network';

export interface GetNftsByAddressOptions {
    address: string | Address;
    network?: Network;
    limit?: number;
    offset?: number;
}

export type GetNftsByAddressReturnType = NFTsResponse;

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
