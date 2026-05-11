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
import type { AnalyticsManagerOptions } from '../analytics';
import type { TONConnectSessionManager } from '../api/interfaces';

/**
 * API client configuration options
 */
export interface ApiClientConfig {
    /** Base URL of the indexer endpoint. Defaults to `'https://toncenter.com'` for mainnet, `'https://testnet.toncenter.com'` for testnet. */
    url?: string;
    /** API key forwarded to the indexer for higher rate limits. */
    key?: string;
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
 * Example: { [Network.mainnet().chainId]: { apiClient: {...} }, [Network.testnet().chainId]: { apiClient: {...} } }
 */
export type NetworkAdapters = {
    [key: string]: NetworkConfig | undefined;
};

/**
 * Main configuration options for TonWalletKit
 */
export interface TonWalletKitOptions {
    /** TonConnect wallet manifest published by the dApp; required for the wallet to recognize the integration. */
    walletManifest?: WalletInfo;
    /** Device fingerprint forwarded with TonConnect requests so wallets can recognize the host. */
    deviceInfo?: DeviceInfo;

    /**
     * Custom session manager implementation.
     * If not provided, TONConnectStoredSessionManager will be used.
     */
    sessionManager?: TONConnectSessionManager;

    /**
     * Network configuration
     */
    networks?: NetworkAdapters;

    /** Bridge settings */
    bridge?: BridgeConfig;
    /** Storage settings */
    storage?: StorageConfig | StorageAdapter;
    /** Validation settings */
    validation?: {
        strictMode?: boolean;
        allowUnknownWalletVersions?: boolean;
    };
    /** Event processor settings */
    eventProcessor?: EventProcessorConfig;

    /** Analytics manager options merged with an `enabled` toggle; off by default. */
    analytics?: AnalyticsManagerOptions & {
        enabled?: boolean;
    };

    /** Diagnostic toggles useful during local development; should not be set in production builds. */
    dev?: {
        disableNetworkSend?: boolean;
        disableManifestDomainCheck?: boolean;
    };
}
