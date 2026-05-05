/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';
import type { TransactionsUpdate, Network } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { resolveNetwork } from '../../utils/network/resolve-network';

export interface WatchTransactionsByAddressOptions {
    address: string | Address;
    onChange: (update: TransactionsUpdate) => void;
    network?: Network;
}

export type WatchTransactionsByAddressReturnType = () => void;

/**
 * Watch transactions by address.
 */
export const watchTransactionsByAddress = (
    appKit: AppKit,
    options: WatchTransactionsByAddressOptions,
): WatchTransactionsByAddressReturnType => {
    const { address, network, onChange } = options;
    const addressString = Address.isAddress(address) ? address.toString() : Address.parse(address).toString();
    const resolvedNetwork = resolveNetwork(appKit, network);

    return appKit.streamingManager.watchTransactions(resolvedNetwork, addressString, onChange);
};
