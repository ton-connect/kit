/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';

export type GetDefaultNetworkReturnType = Network | undefined;

/**
 * Get the current default network
 */
export const getDefaultNetwork = (appKit: AppKit): GetDefaultNetworkReturnType => {
    return appKit.getDefaultNetwork();
};
