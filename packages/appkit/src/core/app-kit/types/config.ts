/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NetworkAdapters, AnalyticsManagerOptions } from '@ton/walletkit';

import type { Connector } from '../../../types/connector';
import type { Provider } from '../../../types/provider';

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
    connectors?: Connector[];
    providers?: Provider[];

    /**
     * Analytics configuration
     */
    analytics?: AnalyticsManagerOptions & {
        enabled?: boolean;
    };
}
