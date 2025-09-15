// Configuration type definitions

import type { WalletInitConfig } from './wallet';
import type { StorageAdapter } from '../storage';
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

    wallets?: Array<WalletInitConfig>;

    /** Network */
    network?: 'mainnet' | 'testnet';

    /** Bridge settings */
    bridge?: BridgeConfig;
    /** Storage settings */
    storage?:
        | {
              prefix?: string;
              cacheTimeout?: number;
              maxCacheSize?: number;
              allowMemory?: boolean;
          }
        | StorageAdapter;
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
}
