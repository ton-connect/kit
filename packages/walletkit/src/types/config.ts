/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Configuration type definitions

import type { StorageAdapter, StorageConfig } from '../storage';
import type { EventProcessorConfig } from '../core/EventProcessor';
import type { DeviceInfo, WalletInfo } from './jsBridge';
import type { BridgeConfig } from './internal';
import type { ApiClient } from './toncenter/ApiClient';

/**
 * API client configuration options
 */
export interface ApiClientConfig {
    url?: string; // default 'https://toncenter.com' for mainnet, 'https://testnet.toncenter.com' for testnet
    key?: string; // key for better RPS limits
}

/**
 * Network configuration for a specific chain
 */
export interface NetworkConfig {
    /** API client configuration or instance */
    apiClient?: ApiClientConfig | ApiClient;
}

/**
 * Multi-network configuration keyed by chain ID
 * Example: { [CHAIN.MAINNET]: { apiClient: {...} }, [CHAIN.TESTNET]: { apiClient: {...} } }
 */
export type NetworkAdapters = {
    [key: string]: NetworkConfig | undefined;
};

/**
 * Main configuration options for TonWalletKit
 */
export interface TonWalletKitOptions {
    walletManifest?: WalletInfo;
    deviceInfo?: DeviceInfo;

    /**
     * Network configuration
     */
    networks?: NetworkAdapters;

    /** Bridge settings */
    bridge?: BridgeConfig;
    /** Storage settings */
    storage?: StorageConfig | StorageAdapter;
    /** Event processor settings */
    eventProcessor?: EventProcessorConfig;

    analytics?: AnalyticsConfig;

    dev?: {
        disableNetworkSend?: boolean;
    };
}

export interface AnalyticsConfig {
    enabled?: boolean;
    endpoint?: string;
}
