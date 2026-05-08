/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { StakingManager } from '../../staking';

/**
 * Return type of {@link getStakingManager}.
 *
 * @public
 * @category Type
 * @section Staking
 */
export type GetStakingManagerReturnType = StakingManager;

/**
 * Read AppKit's {@link StakingManager} — the runtime that owns registered staking providers and dispatches quote/stake/balance calls. Apps usually use the higher-level actions ({@link getStakingQuote}, {@link buildStakeTransaction}, {@link getStakedBalance}) instead of touching the manager directly.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @returns The {@link StakingManager} bound to this AppKit instance.
 *
 * @public
 * @category Action
 * @section Staking
 */
export const getStakingManager = (appKit: AppKit): GetStakingManagerReturnType => {
    return appKit.stakingManager;
};
