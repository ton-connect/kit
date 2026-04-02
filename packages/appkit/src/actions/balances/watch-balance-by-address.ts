/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';
import type { BalanceUpdate, Network } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { resolveNetwork } from '../../utils/network/resolve-network';

export interface WatchBalanceByAddressOptions {
    address: string | Address;
    network?: Network;
    onChange: (update: BalanceUpdate) => void;
}

export type WatchBalanceByAddressReturnType = () => void;

/**
 * Watch account balance changes by address.
 */
export const watchBalanceByAddress = (
    appKit: AppKit,
    options: WatchBalanceByAddressOptions,
): WatchBalanceByAddressReturnType => {
    const { address, network, onChange } = options;
    const addressString = Address.isAddress(address) ? address.toString() : Address.parse(address).toString();
    const resolvedNetwork = resolveNetwork(appKit, network);

    return appKit.streamingManager.watchBalance(resolvedNetwork, addressString, onChange);
};
