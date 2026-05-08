/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * @extract
 * @public
 * @category Type
 * @section Networks
 */
export { Network, NetworkAdapters, NetworkConfig, ApiClientConfig } from '@ton/walletkit';

/**
 * Walletkit-side options shape consumed by {@link KitNetworkManager}'s constructor — chiefly the `networks` map keyed by chain id. {@link AppKit} constructs the manager for you, so apps rarely instantiate this directly.
 *
 * @extract
 * @public
 * @category Type
 * @section Networks
 */
export type { TonWalletKitOptions } from '@ton/walletkit';
