/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { SwapManager } from '../../swap';

/**
 * Return type of {@link getSwapManager}.
 *
 * @public
 * @category Type
 * @section Swap
 */
export type GetSwapManagerReturnType = SwapManager;

/**
 * Read AppKit's {@link SwapManager} — the runtime that owns registered swap providers and dispatches quote/build calls. Apps usually use the higher-level actions ({@link getSwapQuote}, {@link buildSwapTransaction}) instead of touching the manager directly.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @returns The {@link SwapManager} bound to this AppKit instance.
 *
 * @sample docs/examples/src/appkit/actions/swap#GET_SWAP_MANAGER
 *
 * @public
 * @category Action
 * @section Swap
 */
export const getSwapManager = (appKit: AppKit): GetSwapManagerReturnType => {
    return appKit.swapManager;
};
