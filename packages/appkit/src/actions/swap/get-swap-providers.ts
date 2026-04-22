/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SwapProviderInterface } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';

export type GetSwapProvidersReturnType = SwapProviderInterface[];

/**
 * Get all registered swap providers.
 */
export const getSwapProviders = (appKit: AppKit): GetSwapProvidersReturnType => {
    return appKit.swapManager.getProviders();
};
