/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NetworkAdapters, ProviderInput } from '@ton/walletkit';

import type { ConnectorInput } from '../../../types/connector';
import type { Network } from '../../../types/network';

/**
 * Configuration for AppKit
 */
export interface AppKitConfig {
    /**
     * Network configuration
     * At least one network must be configured.
     *
     * Keys are chain IDs (use `Network.mainnet().chainId` or `Network.testnet().chainId`)
     * Values contain apiClient configuration (url and optional API key)
     */
    networks?: NetworkAdapters;

    /**
     * Wallet connectors
     */
    connectors?: ConnectorInput[];

    /**
     * Default network for wallet connections.
     * If set, connectors (e.g. TonConnect) will enforce this network when connecting.
     * Set to `undefined` to allow any network.
     */
    defaultNetwork?: Network;

    providers?: ProviderInput[];

    /**
     * Enable server-side rendering support
     */
    ssr?: boolean;
}
