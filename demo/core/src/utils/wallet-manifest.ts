/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { DeviceInfo, Feature, WalletInfo } from '@ton/walletkit';

import { isExtension } from './is-extension';

export function getTonConnectWalletManifest(): WalletInfo {
    return {
        name: 'tonkeeper', // key for wallet
        aboutUrl: 'https://example.com/about', // url for wallet about
        imageUrl: 'https://example.com/image.png', // url for wallet image
        appName: 'Tonkeeper', // name for wallet
        // supported platforms for wallet
        platforms: ['ios', 'android', 'macos', 'windows', 'linux', 'chrome', 'firefox', 'safari'],
        jsBridgeKey: 'tonkeeper', // window key for wallet bridge
        injected: isExtension(), // if wallet is injected
        embedded: false, // if wallet is embedded (from wallet browser)
        tondns: 'tonkeeper.ton', // tondns for wallet
        bridgeUrl: 'https://bridge.tonapi.io/bridge', // url for wallet bridge
        universalLink: 'https://example.com/universal-link', // universal link for wallet
        deepLink: 'https://example.com/deep-link', // deep link for wallet
        features: getTonConnectFeatures(),
    };
}

export function getTonConnectDeviceInfo(): DeviceInfo {
    return {
        platform: 'browser',
        appName: 'Tonkeeper',
        appVersion: '1.0.0',
        maxProtocolVersion: 2,
        features: getTonConnectFeatures(),
    };
}

export function getTonConnectFeatures(): Feature[] {
    return [
        'SendTransaction',
        {
            name: 'SendTransaction',
            maxMessages: 4,
        },
        {
            name: 'SignData',
            types: ['text', 'binary', 'cell'],
        },
    ];
}
