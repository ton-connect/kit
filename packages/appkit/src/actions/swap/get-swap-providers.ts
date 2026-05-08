/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { SwapProviderInterface } from '../../swap';

/**
 * Return type of {@link getSwapProviders}.
 *
 * @public
 * @category Type
 * @section Swap
 */
export type GetSwapProvidersReturnType = SwapProviderInterface[];

/**
 * List every swap provider registered on this AppKit instance — both those passed via {@link AppKitConfig}`.providers` and those added later through {@link registerProvider}.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @returns Array of registered swap providers.
 *
 * @sample docs/examples/src/appkit/actions/swap#GET_SWAP_PROVIDERS
 *
 * @public
 * @category Action
 * @section Swap
 */
export const getSwapProviders = (appKit: AppKit): GetSwapProvidersReturnType => {
    return appKit.swapManager.getProviders();
};
