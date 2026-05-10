/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { StakingProviderInfo } from '../../staking';
import type { Network } from '../../types/network';
import { resolveNetwork } from '../../utils';

/**
 * Options for {@link getStakingProviderInfo}.
 *
 * @public
 * @category Type
 * @section Staking
 */
export type GetStakingProviderInfoOptions = {
    /** Network whose staking pool should be inspected. Defaults to the selected wallet's network; if no wallet is selected, falls back to AppKit's default network, or mainnet when none is set. */
    network?: Network;
    /** Provider to query; defaults to the registered default staking provider. */
    providerId?: string;
};

/**
 * Return type of {@link getStakingProviderInfo}.
 *
 * @public
 * @category Type
 * @section Staking
 */
export type GetStakingProviderInfoReturnType = Promise<StakingProviderInfo>;

/**
 * Read live staking-pool info for a provider — APR, total pool size, minimum stake, etc. Use {@link getStakingProviderMetadata} for static metadata (display name, logo, supported tokens).
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link GetStakingProviderInfoOptions} Optional network and provider override.
 * @returns Live staking-provider info for the resolved network.
 *
 * @sample docs/examples/src/appkit/actions/staking#GET_STAKING_PROVIDER_INFO
 * @expand options
 *
 * @public
 * @category Action
 * @section Staking
 */
export const getStakingProviderInfo = async (
    appKit: AppKit,
    options: GetStakingProviderInfoOptions = {},
): GetStakingProviderInfoReturnType => {
    return appKit.stakingManager.getStakingProviderInfo(resolveNetwork(appKit, options.network), options.providerId);
};
