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
 * Options for {@link getStakingProvider}.
 *
 * @public
 * @category Type
 * @section Staking
 */
export type GetStakingProviderOptions = {
    /** Provider id to look up; when omitted, returns the registered default staking provider. */
    id?: string;
};

/**
 * Return type of {@link getStakingProvider}.
 *
 * @public
 * @category Type
 * @section Staking
 */
export type GetStakingProviderReturnType = StakingProviderInterface;

/**
 * Get a registered staking provider by id, or the default staking provider when no id is given; throws when no provider matches — or when no id is passed and no default has been registered.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link GetStakingProviderOptions} Optional provider id.
 * @returns The matching staking provider instance.
 *
 * @expand options
 *
 * @public
 * @category Action
 * @section Staking
 */
export const getStakingProvider = (
    appKit: AppKit,
    options: GetStakingProviderOptions = {},
): GetStakingProviderReturnType => {
    return appKit.stakingManager.getProvider(options.id);
};
