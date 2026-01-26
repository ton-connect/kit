/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../../core/app-kit';

export type SetSelectedWalletIdParameters = {
    walletId: string | null;
};

export type SetSelectedWalletIdReturnType = void;

/**
 * Set selected wallet
 */
export function setSelectedWalletId(
    appKit: AppKit,
    parameters: SetSelectedWalletIdParameters,
): SetSelectedWalletIdReturnType {
    appKit.walletsManager.setSelectedWalletId(parameters.walletId);
}
