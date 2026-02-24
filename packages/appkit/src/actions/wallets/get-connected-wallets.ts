/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { WalletInterface } from '../../types/wallet';

export type GetConnectedWalletsReturnType = readonly WalletInterface[];

/**
 * Get connected wallets
 */
export const getConnectedWallets = (appKit: AppKit): GetConnectedWalletsReturnType => {
    return appKit.walletsManager.wallets;
};
