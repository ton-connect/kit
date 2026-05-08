/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { SwapProviderInterface } from '../../swap';

export type GetSwapProvidersReturnType = SwapProviderInterface[];

/**
 * Get all registered swap providers.
 */
export const getSwapProviders = (appKit: AppKit): GetSwapProvidersReturnType => {
    return appKit.swapManager.getProviders();
};
