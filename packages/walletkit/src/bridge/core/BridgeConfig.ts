/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { DeviceInfo, WalletInfo } from '../../types/jsBridge';

/**
 * Configuration for the TonConnect JS Bridge
 */
export interface BridgeConfig {
    /**
     * Device information as per TonConnect spec
     */
    deviceInfo: DeviceInfo;

    /**
     * Wallet information as per TonConnect spec
     */
    walletInfo: WalletInfo;

    /**
     * Key used to inject bridge into window object (e.g., 'ton', 'mywallet')
     */
    jsBridgeKey: string;

    /**
     * Whether this is a wallet browser environment
     */
    isWalletBrowser: boolean;

    /**
     * Protocol version to support
     */
    protocolVersion: number;
}

/**
 * Validates and normalizes bridge configuration
 */
export function validateBridgeConfig(config: BridgeConfig): void {
    if (!config.deviceInfo) {
        throw new Error('deviceInfo is required');
    }

    if (!config.walletInfo) {
        throw new Error('walletInfo is required');
    }

    if (!config.jsBridgeKey || typeof config.jsBridgeKey !== 'string') {
        throw new Error('jsBridgeKey must be a non-empty string');
    }

    if (config.protocolVersion < 2) {
        throw new Error('protocolVersion must be at least 2');
    }
}
