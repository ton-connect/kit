/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { WalletInterface } from '../../types/wallet';

export type GetSelectedWalletReturnType = WalletInterface | null;

/**
 * Get currently selected wallet
 */
export const getSelectedWallet = (appKit: AppKit): GetSelectedWalletReturnType => {
    return appKit.walletsManager.selectedWallet;
};
