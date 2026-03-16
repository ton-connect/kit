/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StakingBalance, UserFriendlyAddress, Network } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { resolveNetwork } from '../../utils';

export type GetStakedBalanceOptions = {
    userAddress: UserFriendlyAddress;
    network?: Network;
    providerId?: string;
};

export type GetStakedBalanceReturnType = Promise<StakingBalance>;

/**
 * Get staked balance
 */
export const getStakedBalance = async (
    appKit: AppKit,
    options: GetStakedBalanceOptions,
): GetStakedBalanceReturnType => {
    return appKit.stakingManager.getStakedBalance(
        options.userAddress,
        resolveNetwork(appKit, options.network),
        options.providerId,
    );
};
