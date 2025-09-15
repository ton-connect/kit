import { DeviceInfo, WalletInfo } from '../types/jsBridge';

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

export function getWalletInfoWithDefaults(options?: Partial<WalletInfo>): WalletInfo {
    const walletInfo: WalletInfo = {
        ...DEFAULT_WALLET_INFO,
        ...options,
    };

    return walletInfo;
}
