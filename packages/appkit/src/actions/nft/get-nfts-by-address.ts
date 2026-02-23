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
import { getDefaultNetwork } from '../network/get-default-network';

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

    const client = appKit.networkManager.getClient(network ?? getDefaultNetwork(appKit) ?? Network.mainnet());

    return getNftsFromClient(client, addressString, {
        pagination: {
            limit,
            offset,
        },
    });
};
