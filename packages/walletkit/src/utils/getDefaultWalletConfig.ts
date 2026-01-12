/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SendTransactionFeature, SignDataFeature } from '@tonconnect/protocol';

import type { DeviceInfo, WalletInfo } from '../types/jsBridge';
import type { WalletAdapter } from '../api/interfaces';

/**
 * Default device info for JS Bridge
 */
const DEFAULT_DEVICE_INFO: DeviceInfo = {
    platform: 'browser',
    appName: 'Wallet',
    appVersion: '1.0.0',
    maxProtocolVersion: 2,
    features: [
        'SendTransaction',
        {
            name: 'SendTransaction',
            maxMessages: 1,
        },
    ],
};

const DEFAULT_WALLET_INFO: WalletInfo = {
    name: 'Wallet',
    appName: 'Wallet',
    imageUrl: 'https://example.com/image.png',
    bridgeUrl: 'https://example.com/bridge.png',
    universalLink: 'https://example.com/universal-link',
    aboutUrl: 'https://example.com/about',
    platforms: ['chrome', 'firefox', 'safari', 'android', 'ios', 'windows', 'macos', 'linux'],
    jsBridgeKey: 'wallet',
};

export function getDeviceInfoWithDefaults(options?: Partial<DeviceInfo>): DeviceInfo {
    const deviceInfo: DeviceInfo = {
        ...DEFAULT_DEVICE_INFO,
        ...options,
    };

    return deviceInfo;
}

export function createDeviceInfo(options?: Partial<DeviceInfo>): DeviceInfo {
    const infoWithDefaults = getDeviceInfoWithDefaults(options);

    const features = [];
    // send transaction feature
    if (
        infoWithDefaults.features.some((feature) => typeof feature === 'object' && feature.name === 'SendTransaction')
    ) {
        const sendTransactionFeature = infoWithDefaults.features.find(
            (feature) => typeof feature === 'object' && feature.name === 'SendTransaction',
        ) as SendTransactionFeature;

        if (sendTransactionFeature) {
            features.push({
                name: 'SendTransaction',
                maxMessages: sendTransactionFeature.maxMessages ?? 1,
            });
            features.push('SendTransaction');
        }
    } else if (infoWithDefaults.features.some((feature) => feature === 'SendTransaction')) {
        features.push('SendTransaction');
    }

    if (infoWithDefaults.features.some((feature) => typeof feature === 'object' && feature.name === 'SignData')) {
        const signDataFeature = infoWithDefaults.features.find(
            (feature) => typeof feature === 'object' && feature.name === 'SignData',
        ) as SignDataFeature;

        if (signDataFeature) {
            features.push({
                name: 'SignData',
                types: signDataFeature.types,
            });
        }
    }

    return infoWithDefaults;
}

export function createWalletManifest(options?: Partial<WalletInfo>): WalletInfo {
    const walletInfo: WalletInfo = getWalletInfoWithDefaults(options);

    return walletInfo;
}

export function getWalletInfoWithDefaults(options?: Partial<WalletInfo>): WalletInfo {
    const walletInfo: WalletInfo = {
        ...DEFAULT_WALLET_INFO,
        ...options,
    };

    return walletInfo;
}

/**
 * Get device info with wallet-specific features if available
 * If wallet adapter has getSupportedFeatures(), use those features
 * Otherwise, use features from deviceInfo
 */
export function getDeviceInfoForWallet(
    walletAdapter: WalletAdapter | undefined,
    deviceInfoOptions?: Partial<DeviceInfo>,
): DeviceInfo {
    const baseDeviceInfo = getDeviceInfoWithDefaults(deviceInfoOptions);

    // If wallet adapter has getSupportedFeatures(), use those features
    if (walletAdapter?.getSupportedFeatures) {
        return {
            ...baseDeviceInfo,
            features: ['SendTransaction', ...walletAdapter.getSupportedFeatures()],
        };
    }

    // Otherwise, use features from deviceInfo
    return baseDeviceInfo;
}
