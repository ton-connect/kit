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
 * Options for {@link getSwapProvider}.
 *
 * @public
 * @category Type
 * @section Swap
 */
export interface GetSwapProviderOptions {
    /** Provider ID to look up. When omitted, returns the registered default swap provider. */
    id?: string;
}

/**
 * Return type of {@link getSwapProvider}.
 *
 * @public
 * @category Type
 * @section Swap
 */
export type GetSwapProviderReturnType = SwapProviderInterface;

/**
 * Get a registered swap provider by id, or the default swap provider when no id is given. Throws when no provider matches — or when no id is passed and no default has been registered.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link GetSwapProviderOptions} Optional provider id.
 * @returns The matching swap provider instance.
 *
 * @sample docs/examples/src/appkit/actions/swap#GET_SWAP_PROVIDER
 * @expand options
 *
 * @public
 * @category Action
 * @section Swap
 */
export const getSwapProvider = (appKit: AppKit, options: GetSwapProviderOptions = {}): GetSwapProviderReturnType => {
    return appKit.swapManager.getProvider(options.id);
};
