/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CHAIN } from "@tonconnect/protocol";

import type { StorageAdapter, StorageConfig } from "../../storage";
import type { EventProcessorConfig } from "../../core/EventProcessor";
import type { DeviceInfo, WalletInfo } from "../../types/jsBridge";
import type { BridgeConfig } from "../../types/internal";
import type { ApiClient } from "../../types/toncenter/ApiClient";

/**
 * API client configuration options
 */
export interface ApiClientConfiguration {
  /**
   * API endpoint URL
   * Default: 'https://toncenter.com' for mainnet, 'https://testnet.toncenter.com' for testnet
   */
  url?: string;
  /**
   * API key for better RPS limits
   */
  key?: string;
}

/**
 * Network configuration for a specific chain
 */
export interface NetworkConfiguration {
  /**
   * API client configuration or instance
   */
  apiClient?: ApiClientConfiguration | ApiClient;
}

/**
 * Multi-network configuration keyed by chain ID
 * Example: { [CHAIN.MAINNET]: { apiClient: {...} }, [CHAIN.TESTNET]: { apiClient: {...} } }
 */
export type NetworkAdaptersConfiguration = {
  [K in CHAIN]?: NetworkConfiguration;
};

/**
 * Analytics configuration options
 */
export interface AnalyticsConfiguration {
  /**
   * Whether analytics is enabled
   */
  enabled?: boolean;
  /**
   * Analytics endpoint URL
   */
  endpoint?: string;
}

/**
 * Validation configuration options
 */
export interface ValidationConfiguration {
  /**
   * Whether to use strict validation mode
   */
  strictMode?: boolean;
  /**
   * Whether to allow unknown wallet versions
   */
  allowUnknownWalletVersions?: boolean;
}

/**
 * Development configuration options
 */
export interface DevConfiguration {
  /**
   * Whether to disable network send (for testing)
   */
  disableNetworkSend?: boolean;
}

/**
 * Main configuration options for WalletKit.
 */
export interface WalletKitConfiguration {
  /**
   * Wallet manifest information
   */
  walletManifest?: WalletInfo;
  /**
   * Device information
   */
  deviceInfo?: DeviceInfo;
  /**
   * Network configuration
   */
  networks?: NetworkAdaptersConfiguration;
  /**
   * Bridge settings
   */
  bridge?: BridgeConfig;
  /**
   * Storage settings
   */
  storage?: StorageConfig | StorageAdapter;
  /**
   * Validation settings
   */
  validation?: ValidationConfiguration;
  /**
   * Event processor settings
   */
  eventProcessor?: EventProcessorConfig;
  /**
   * Analytics settings
   */
  analytics?: AnalyticsConfiguration;
  /**
   * Development settings
   */
  dev?: DevConfiguration;
}
