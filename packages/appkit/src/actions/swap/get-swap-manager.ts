/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SwapManager } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';

export type GetSwapManagerReturnType = SwapManager;

/**
 * Get swap manager instance
 */
export const getSwapManager = (appKit: AppKit): GetSwapManagerReturnType => {
    return appKit.swapManager;
};
