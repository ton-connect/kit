/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { DeviceInfo, WalletInfo } from '@ton/walletkit';
import { createDeviceInfo, createWalletManifest } from '@ton/walletkit';

/**
 *  Full wallet manifest need add to:
 *  * https://github.com/ton-connect/wallets-list-staging/blob/main/wallets-v2.json
 *  * https://github.com/ton-connect/wallets-list/blob/main/wallets-v2.json
 */
export function getTonConnectWalletManifest(): WalletInfo {
    return createWalletManifest({
        // Unique wallet key
        name: 'wallet_kit_demo_wallet',
        // Display name for the wallet application
        appName: 'WalletKitDemoWallet',
        // URL to wallet logo
        imageUrl: 'https://ton.org/download/ton_symbol.png',
        // URL to TonConnect bridge
        bridgeUrl: 'https://bridge.tonapi.io/bridge',
        // Universal link for opening the wallet
        universalLink: 'https://walletkit-demo-wallet.vercel.app/ton-connect',
        // About page URL
        aboutUrl: 'https://walletkit-demo-wallet.vercel.app',
        // Supported platforms
        platforms: ['macos', 'windows', 'linux'],
    });
}

function detectPlatform(): 'linux' | 'macos' | 'windows' {
    const platform = process.platform;
    switch (platform) {
        case 'darwin':
            return 'macos';
        case 'win32':
            return 'windows';
        case 'linux':
        default:
            return 'linux';
    }
}

export function getTonConnectDeviceInfo(): DeviceInfo {
    return createDeviceInfo({
        platform: detectPlatform(),
        appName: 'WalletKitDemoWallet',
        appVersion: '1.0.0',
        maxProtocolVersion: 2,
        features: [
            {
                name: 'SendTransaction',
                maxMessages: 4,
                extraCurrencySupported: false,
            },
            {
                name: 'SignData',
                types: ['text', 'binary', 'cell'],
            },
        ],
    });
}
