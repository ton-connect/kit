/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * {@link StakingProvider} implementation backed by Tonstakers. The constructor is private — always go through the {@link createTonstakersProvider} factory and pass the result to {@link AppKitConfig}'s `providers` or {@link registerProvider}.
 *
 * @extract
 * @public
 * @category Class
 * @section Staking
 */
export { TonStakersStakingProvider } from '@ton/walletkit/staking/tonstakers';

/**
 * Build a Tonstakers-backed {@link StakingProvider} for AppKit. Pass the result to {@link AppKitConfig}'s `providers` or {@link registerProvider}.
 *
 * @extract
 * @public
 * @category Action
 * @section Staking
 */
export { createTonstakersProvider } from '@ton/walletkit/staking/tonstakers';

/**
 * Configuration accepted by {@link createTonstakersProvider}.
 *
 * @extract
 * @public
 * @category Type
 * @section Staking
 */
export type { TonStakersProviderConfig } from '@ton/walletkit/staking/tonstakers';
