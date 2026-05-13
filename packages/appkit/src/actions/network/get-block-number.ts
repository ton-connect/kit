/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import { Network } from '../../types/network';

/**
 * Options for {@link getBlockNumber}.
 *
 * @public
 * @category Type
 * @section Networks
 */
export interface GetBlockNumberOptions {
    /** Network to query. Defaults to mainnet when omitted. */
    network?: Network;
}

/**
 * Return type of {@link getBlockNumber}.
 *
 * @public
 * @category Type
 * @section Networks
 */
export type GetBlockNumberReturnType = number;

/**
 * Read the latest masterchain seqno (block number) for a network — useful for pagination cursors and freshness checks. Defaults to mainnet when no network is given.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link GetBlockNumberOptions} Optional network override.
 * @returns Current masterchain seqno as a number.
 *
 * @sample docs/examples/src/appkit/actions/network#GET_BLOCK_NUMBER
 * @expand options
 *
 * @public
 * @category Action
 * @section Networks
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
