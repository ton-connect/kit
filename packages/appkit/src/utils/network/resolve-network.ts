/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Network } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { getSelectedWallet } from '../../actions/wallets/get-selected-wallet';
import { getDefaultNetwork } from '../../actions/network/get-default-network';

/**
 * Resolve the network to use for API requests.
 *
 * Priority:
 * 1. Explicitly passed `network` parameter
 * 2. Selected wallet's network
 * 3. Configured default network
 * 4. Mainnet (last resort)
 */
export const resolveNetwork = (appKit: AppKit, network?: Network): Network => {
    if (network) return network;

    const wallet = getSelectedWallet(appKit);
    if (wallet) return wallet.getNetwork();

    return getDefaultNetwork(appKit) ?? Network.mainnet();
};
