/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';

export type GetNetworksReturnType = Network[];

/**
 * Get all configured networks
 */
export const getNetworks = (appKit: AppKit): GetNetworksReturnType => {
    return appKit.networkManager.getConfiguredNetworks();
};
