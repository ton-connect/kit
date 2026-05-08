/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';

/**
 * Parameters accepted by {@link setDefaultSwapProvider}.
 *
 * @public
 * @category Type
 * @section Swap
 */
export interface SetDefaultSwapProviderParameters {
    /** Id of the provider to make default — must already be registered. */
    providerId: string;
}

/**
 * Return type of {@link setDefaultSwapProvider}.
 *
 * @public
 * @category Type
 * @section Swap
 */
export type SetDefaultSwapProviderReturnType = void;

/**
 * Set the default swap provider — subsequent {@link getSwapQuote} and {@link buildSwapTransaction} calls without an explicit `providerId` route through it. Emits `provider:default-changed`, picked up by {@link watchSwapProviders}.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link SetDefaultSwapProviderParameters} Id of the provider to make default.
 *
 * @sample docs/examples/src/appkit/actions/swap#SET_DEFAULT_SWAP_PROVIDER
 * @expand parameters
 *
 * @public
 * @category Action
 * @section Swap
 */
export const setDefaultSwapProvider = (
    appKit: AppKit,
    parameters: SetDefaultSwapProviderParameters,
): SetDefaultSwapProviderReturnType => {
    appKit.swapManager.setDefaultProvider(parameters.providerId);
};
