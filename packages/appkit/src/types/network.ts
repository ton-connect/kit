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
export { Network, NetworkAdapters, NetworkConfig } from '@ton/walletkit';

/**
 * Configuration accepted by {@link NetworkConfig}'s `apiClient` — picks an {@link ApiClient} implementation (Toncenter / TonAPI) and supplies its endpoint URL plus optional API key.
 *
 * @extract
 * @public
 * @category Type
 * @section Client
 */
export { ApiClientConfig } from '@ton/walletkit';

/**
 * Walletkit-side options shape consumed by {@link KitNetworkManager}'s constructor — chiefly the `networks` map keyed by chain id. {@link AppKit} constructs the manager for you, so apps rarely instantiate this directly.
 *
 * @extract
 * @public
 * @category Type
 * @section Networks
 */
export type { TonWalletKitOptions } from '@ton/walletkit';
