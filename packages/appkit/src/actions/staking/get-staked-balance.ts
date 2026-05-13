/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { StakingBalance } from '../../staking';
import type { Network } from '../../types/network';
import type { UserFriendlyAddress } from '../../types/primitives';
import { resolveNetwork } from '../../utils';

/**
 * Options for {@link getStakedBalance}.
 *
 * @public
 * @category Type
 * @section Staking
 */
export type GetStakedBalanceOptions = {
    /** Owner whose staked balance should be read. */
    userAddress: UserFriendlyAddress;
    /** Network to query. Defaults to the selected wallet's network. If no wallet is selected, falls back to AppKit's default network, or mainnet when none is set. */
    network?: Network;
    /** Provider to query. Defaults to the registered default staking provider. */
    providerId?: string;
};

/**
 * Return type of {@link getStakedBalance}.
 *
 * @public
 * @category Type
 * @section Staking
 */
export type GetStakedBalanceReturnType = Promise<StakingBalance>;

/**
 * Read a user's staked balance from a staking provider — total staked plus, depending on the provider, any instant-unstake balance available right now.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link GetStakedBalanceOptions} Owner address and optional network/provider override.
 * @returns Staked-balance breakdown ({@link StakingBalance}) for the user on the resolved network/provider.
 *
 * @sample docs/examples/src/appkit/actions/staking#GET_STAKED_BALANCE
 * @expand options
 *
 * @public
 * @category Action
 * @section Staking
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
