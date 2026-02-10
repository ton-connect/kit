/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';
import { Network, ParseStack } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';

export interface GetSeqnoOptions {
    address: string | Address;
    network?: Network;
}

export type GetSeqnoReturnType = number | null;

export const getSeqno = async (appKit: AppKit, options: GetSeqnoOptions): Promise<GetSeqnoReturnType> => {
    const { address, network } = options;
    const addressString = Address.isAddress(address) ? address.toString() : Address.parse(address).toString();

    const client = appKit.networkManager.getClient(network ?? Network.mainnet());

    try {
        const result = await client.runGetMethod(addressString, 'seqno');
        const parsedStack = ParseStack(result.stack);
        const seqno = parsedStack[0].type === 'int' ? Number(parsedStack[0].value) : null;
        return seqno;
    } catch {
        return null; // Return null if seqno cannot be fetched (e.g. uninitialized wallet)
    }
};
