/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';
import type { TokenAmount, Network } from '@ton/walletkit';
import { formatUnits } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { resolveNetwork } from '../../utils/network/resolve-network';

export interface GetBalanceByAddressOptions {
    address: string | Address;
    network?: Network;
}

export type GetBalanceByAddressReturnType = TokenAmount;

export const getBalanceByAddress = async (
    appKit: AppKit,
    options: GetBalanceByAddressOptions,
): Promise<GetBalanceByAddressReturnType> => {
    const { address, network } = options;
    const addressString = Address.isAddress(address) ? address.toString() : Address.parse(address).toString();

    const client = appKit.networkManager.getClient(resolveNetwork(appKit, network));
    const balance = await client.getBalance(addressString);

    return formatUnits(balance, 9);
};
