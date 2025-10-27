/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Configuration type definitions

import { CHAIN } from '@tonconnect/protocol';

import type { StorageAdapter, StorageConfig } from '../storage';
import { EventProcessorConfig } from '../core/EventProcessor';
import { DeviceInfo, WalletInfo } from './jsBridge';
import { BridgeConfig } from './internal';
import { ApiClient } from './toncenter/ApiClient';

/**
 * Main configuration options for TonWalletKit
 */
export interface TonWalletKitOptions {
    walletManifest?: WalletInfo;
    deviceInfo?: DeviceInfo;

    /** Network */
    network?: CHAIN;

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

    apiClient?:
        | {
              url?: string; // default 'https://toncenter.com'
              key?: string; // key for better RPS limits
          }
        | ApiClient;

    analytics?: AnalyticsConfig;

    dev?: {
        disableNetworkSend?: boolean;
    };
}

export interface AnalyticsConfig {
    enabled?: boolean;
    endpoint?: string;
}
