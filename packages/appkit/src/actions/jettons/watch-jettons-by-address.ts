/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';
import type { JettonUpdate, Network } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { resolveNetwork } from '../../utils/network/resolve-network';

export interface WatchJettonsByAddressOptions {
    address: string | Address;
    onChange: (update: JettonUpdate) => void;
    network?: Network;
}

export type WatchJettonsByAddressReturnType = () => void;

/**
 * Watch jetton updates by owner address.
 */
export const watchJettonsByAddress = (
    appKit: AppKit,
    options: WatchJettonsByAddressOptions,
): WatchJettonsByAddressReturnType => {
    const { address, network, onChange } = options;
    const addressString = Address.isAddress(address) ? address.toString() : Address.parse(address).toString();
    const resolvedNetwork = resolveNetwork(appKit, network);

    return appKit.streamingManager.watchJettons(resolvedNetwork, addressString, onChange);
};
