// Content script for TON Wallet Demo extension
/* eslint-disable no-console */
import { Buffer } from 'buffer';

window.Buffer = Buffer;
if (globalThis && !globalThis.Buffer) {
    globalThis.Buffer = Buffer;
}

import { injectBridgeCode } from '@ton/walletkit/bridge';

function injectTonConnectBridge() {
    try {
        // Inject the bridge directly into the window object
        injectBridgeCode({
            walletName: 'tonkeeper',
            deviceInfo: {
                platform: 'web',
                appName: 'TON Wallet Demo',
                appVersion: '1.0.0',
                maxProtocolVersion: 2,
                features: [
                    {
                        name: 'SendTransaction',
                        maxMessages: 4,
                    },
                    {
                        name: 'SignData',
                        types: ['text', 'binary', 'cell'],
                    },
                ],
            },
            walletInfo: {
                name: 'TON Wallet Demo',
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzAwN0RGRiIvPgo8cGF0aCBkPSJNOSA5SDE0VjE0SDlWOVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9K0xOCA5SDIzVjE0SDE4VjlaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNOSAxOEgxNFYyM0g5VjE4WiIgZmlsbD0id2hpdGUiLz4KPHA+PC9zdmc+',
                about_url: 'https://example.com/about',
            },
        });

        console.log('TonConnect bridge injected successfully using walletKit');
    } catch (error) {
        console.error('Failed to inject TonConnect bridge:', error);
    }
}

injectTonConnectBridge();
