/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';
import type { Jetton, JettonsResponse } from '@ton/walletkit';
import { Network, getJettonsFromClient, formatUnits } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { getDefaultNetwork } from '../network/get-default-network';

export interface GetJettonsByAddressOptions {
    address: string | Address;
    network?: Network;
    limit?: number;
    offset?: number;
}

export type GetJettonsByAddressReturnType = JettonsResponse;

export const getJettonsByAddress = async (
    appKit: AppKit,
    options: GetJettonsByAddressOptions,
): Promise<GetJettonsByAddressReturnType> => {
    const { address, network, limit, offset } = options;
    const addressString = Address.isAddress(address) ? address.toString() : Address.parse(address).toString();

    const client = appKit.networkManager.getClient(network ?? getDefaultNetwork(appKit) ?? Network.mainnet());
    const response = await getJettonsFromClient(client, addressString, {
        pagination: {
            limit,
            offset,
        },
    });

    const jettons = response.jettons.reduce((acc, jetton) => {
        if (!jetton.decimalsNumber) {
            return acc;
        }

        acc.push({
            ...jetton,
            balance: formatUnits(jetton.balance, jetton.decimalsNumber),
        });
        return acc;
    }, [] as Jetton[]);

    return {
        ...response,
        jettons,
    };
};
