/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { StakingProviderInterface } from '../../staking';

/**
 * Return type of {@link getStakingProviders}.
 *
 * @public
 * @category Type
 * @section Staking
 */
export type GetStakingProvidersReturnType = StakingProviderInterface[];

/**
 * List every staking provider registered on this AppKit instance — both those passed via {@link AppKitConfig}`.providers` and those added later through {@link registerProvider}.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @returns Array of registered staking providers.
 *
 * @sample docs/examples/src/appkit/actions/staking#GET_STAKING_PROVIDERS
 *
 * @public
 * @category Action
 * @section Staking
 */
export const getStakingProviders = (appKit: AppKit): GetStakingProvidersReturnType => {
    return appKit.stakingManager.getProviders();
};
