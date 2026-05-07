/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';

export interface SetDefaultStakingProviderParameters {
    providerId: string;
}

export type SetDefaultStakingProviderReturnType = void;

/**
 * Set the default staking provider.
 * Subsequent quote and stake-transaction calls will use this provider when none is specified.
 */
export const setDefaultStakingProvider = (
    appKit: AppKit,
    parameters: SetDefaultStakingProviderParameters,
): SetDefaultStakingProviderReturnType => {
    appKit.stakingManager.setDefaultProvider(parameters.providerId);
};
