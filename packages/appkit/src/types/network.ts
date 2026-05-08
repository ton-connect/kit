/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    Network as WalletkitNetwork,
    NetworkAdapters as WalletkitNetworkAdapters,
    NetworkConfig as WalletkitNetworkConfig,
    ApiClientConfig as WalletkitApiClientConfig,
} from '@ton/walletkit';
import { Network as WalletkitNetworkValue } from '@ton/walletkit';

/**
 * @extract
 * @public
 * @category Type
 * @section Networks
 */
export type Network = WalletkitNetwork;

// Value side of `Network` (the `Network.mainnet()` / `Network.testnet()` factory). Lives next to the type via declaration merging.
export const Network = WalletkitNetworkValue;

/**
 * @extract
 * @public
 * @category Type
 * @section Networks
 */
export type NetworkAdapters = WalletkitNetworkAdapters;

/**
 * @extract
 * @public
 * @category Type
 * @section Networks
 */
export type NetworkConfig = WalletkitNetworkConfig;

/**
 * @extract
 * @public
 * @category Type
 * @section Networks
 */
export type ApiClientConfig = WalletkitApiClientConfig;
