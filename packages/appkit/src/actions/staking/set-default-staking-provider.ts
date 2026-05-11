/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';

/**
 * Parameters accepted by {@link setDefaultStakingProvider}.
 *
 * @public
 * @category Type
 * @section Staking
 */
export interface SetDefaultStakingProviderParameters {
    /** ID of the provider to make default — must already be registered. */
    providerId: string;
}

/**
 * Return type of {@link setDefaultStakingProvider}.
 *
 * @public
 * @category Type
 * @section Staking
 */
export type SetDefaultStakingProviderReturnType = void;

/**
 * Set the default staking provider — subsequent {@link getStakingQuote} and {@link buildStakeTransaction} calls without an explicit `providerId` route through it. Emits `provider:default-changed`, picked up by {@link watchStakingProviders}.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link SetDefaultStakingProviderParameters} ID of the provider to make default.
 *
 * @expand parameters
 *
 * @public
 * @category Action
 * @section Staking
 */
export const setDefaultStakingProvider = (
    appKit: AppKit,
    parameters: SetDefaultStakingProviderParameters,
): SetDefaultStakingProviderReturnType => {
    appKit.stakingManager.setDefaultProvider(parameters.providerId);
};
