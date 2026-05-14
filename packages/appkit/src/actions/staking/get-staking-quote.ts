/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { StakingQuote, StakingQuoteParams } from '../../staking';
import { resolveNetwork } from '../../utils';

/**
 * Options for {@link getStakingQuote} — extends {@link StakingQuoteParams} with an optional provider override.
 *
 * @public
 * @category Type
 * @section Staking
 */
export type GetStakingQuoteOptions = StakingQuoteParams & {
    /** Provider to quote against. Defaults to the registered default staking provider. */
    providerId?: string;
};

/**
 * Return type of {@link getStakingQuote}.
 *
 * @public
 * @category Type
 * @section Staking
 */
export type GetStakingQuoteReturnType = Promise<StakingQuote>;

/**
 * Quote a stake or unstake — given the amount, direction and target asset, returns the rate, expected output and provider metadata needed to call {@link buildStakeTransaction}.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link GetStakingQuoteOptions} Quote parameters and optional provider override.
 * @returns Quote with pricing details and provider metadata.
 *
 * @sample docs/examples/src/appkit/actions/staking#GET_STAKING_QUOTE
 * @expand options
 *
 * @public
 * @category Action
 * @section Staking
 */
export const getStakingQuote = async (appKit: AppKit, options: GetStakingQuoteOptions): GetStakingQuoteReturnType => {
    const optionsWithNetwork = {
        ...options,
        network: resolveNetwork(appKit, options.network),
    };

    return appKit.stakingManager.getQuote(optionsWithNetwork, options.providerId);
};
