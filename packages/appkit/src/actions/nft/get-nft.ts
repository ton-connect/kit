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
import { getNftFromClient } from '../../utils';
import { resolveNetwork } from '../../utils/network/resolve-network';

export interface GetNftOptions {
    address: string | Address;
    network?: Network;
}

export type GetNftReturnType = NFT | null;

export const getNft = async (appKit: AppKit, options: GetNftOptions): Promise<GetNftReturnType> => {
    const { address, network } = options;
    const addressString = Address.isAddress(address) ? address.toString() : Address.parse(address).toString();

    const client = appKit.networkManager.getClient(resolveNetwork(appKit, network));

    return getNftFromClient(client, addressString);
};
