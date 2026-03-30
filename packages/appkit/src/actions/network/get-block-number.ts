/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Network } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';

export interface GetBlockNumberOptions {
    network?: Network;
}

export type GetBlockNumberReturnType = number;

/**
 * Get the latest block number (seqno) of the masterchain for the specified network (or mainnet by default).
 */
export const getBlockNumber = async (
    appKit: AppKit,
    options: GetBlockNumberOptions = {},
): Promise<GetBlockNumberReturnType> => {
    const network = options.network ?? Network.mainnet();
    const client = appKit.networkManager.getClient(network);

    const masterchainInfo = await client.getMasterchainInfo();
    return masterchainInfo.seqno;
};
