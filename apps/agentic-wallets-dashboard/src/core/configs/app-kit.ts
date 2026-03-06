/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AppKit, Network, ApiClientTonApi } from '@ton/appkit';
import { TonConnectConnector } from '@ton/appkit';
import { THEME } from '@tonconnect/ui';

import { ENV_TON_API_KEY_MAINNET, ENV_TON_API_KEY_TESTNET, ENV_TON_API_MIN_REQUEST_INTERVAL_MS } from '@/core/configs/env';

export const appKit = new AppKit({
    networks: {
        [Network.mainnet().chainId]: {
            apiClient: new ApiClientTonApi({
                network: Network.mainnet(),
                apiKey: ENV_TON_API_KEY_MAINNET,
                minRequestIntervalMs: ENV_TON_API_MIN_REQUEST_INTERVAL_MS,
            }),
        },
        [Network.testnet().chainId]: {
            apiClient: new ApiClientTonApi({
                network: Network.testnet(),
                apiKey: ENV_TON_API_KEY_TESTNET,
                minRequestIntervalMs: ENV_TON_API_MIN_REQUEST_INTERVAL_MS,
            }),
        },
    },
    connectors: [
        new TonConnectConnector({
            tonConnectOptions: {
                manifestUrl: 'https://tonconnect-sdk-demo-dapp.vercel.app/tonconnect-manifest.json',
                uiPreferences: {
                    theme: THEME.DARK,
                    borderRadius: 's',
                    colorsSet: {
                        [THEME.DARK]: {
                            connectButton: {
                                background: '#f59e0b',
                                foreground: '#000000',
                            },
                            accent: '#f59e0b',
                            background: {
                                primary: '#0a0a0a',
                                secondary: '#141414',
                                segment: '#1a1a1a',
                                tint: '#2b1c05',
                                qr: '#ffffff',
                            },
                            text: {
                                primary: '#ffffff',
                                secondary: 'rgba(255, 255, 255, 0.55)',
                            },
                            icon: {
                                primary: '#ffffff',
                                secondary: 'rgba(255, 255, 255, 0.55)',
                                tertiary: 'rgba(255, 255, 255, 0.3)',
                                success: '#22c55e',
                                error: '#ef4444',
                            },
                        },
                    },
                },
            },
        }),
    ],
});
