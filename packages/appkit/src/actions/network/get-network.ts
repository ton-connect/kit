/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { getSelectedWallet } from '../wallets/get-selected-wallet';

export type GetNetworkReturnType = Network | null;

/**
 * Get the network of the currently selected wallet
 */
export const getNetwork = (appKit: AppKit): GetNetworkReturnType => {
    const wallet = getSelectedWallet(appKit);

    return wallet?.getNetwork() ?? null;
};
