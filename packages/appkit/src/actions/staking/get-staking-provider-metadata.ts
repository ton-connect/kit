/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { StakingProviderMetadata } from '../../staking';
import type { Network } from '../../types/network';
import { resolveNetwork } from '../../utils';

/**
 * Options for {@link getStakingProviderMetadata}.
 *
 * @public
 * @category Type
 * @section Staking
 */
export type GetStakingProviderMetadataOptions = {
    /** Network whose provider metadata should be read. Defaults to the selected wallet's network. If no wallet is selected, falls back to AppKit's default network, or mainnet when none is set. */
    network?: Network;
    /** Provider to query. Defaults to the registered default staking provider. */
    providerId?: string;
};

/**
 * Return type of {@link getStakingProviderMetadata}.
 *
 * @public
 * @category Type
 * @section Staking
 */
export type GetStakingProviderMetadataReturnType = StakingProviderMetadata;

/**
 * Read static metadata for a staking provider — display name, stake/receive tokens, supported unstake modes, contract address. Use {@link getStakingProviderInfo} for live values (APY, instant-unstake liquidity, exchange rate).
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link GetStakingProviderMetadataOptions} Optional network and provider override.
 * @returns Static {@link StakingProviderMetadata} for the resolved provider.
 *
 * @sample docs/examples/src/appkit/actions/staking#GET_STAKING_PROVIDER_METADATA
 * @expand options
 *
 * @public
 * @category Action
 * @section Staking
 */
export const getStakingProviderMetadata = (
    appKit: AppKit,
    options: GetStakingProviderMetadataOptions = {},
): GetStakingProviderMetadataReturnType => {
    return appKit.stakingManager.getStakingProviderMetadata(
        resolveNetwork(appKit, options.network),
        options.providerId,
    );
};
