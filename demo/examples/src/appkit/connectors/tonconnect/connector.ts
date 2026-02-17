/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AppKit, Network } from '@ton/appkit';
import { TonConnectConnector } from '@ton/appkit';
import { TonConnectUI } from '@tonconnect/ui';

export const tonConnectConnectorExample = async () => {
    // SAMPLE_START: TON_CONNECT_CONNECTOR
    // 1. Create TonConnectUI instance
    const tonConnectUI = new TonConnectUI({
        manifestUrl: 'https://my-app.com/tonconnect-manifest.json',
    });

    // 2. Initialize AppKit
    const appKit = new AppKit({
        networks: {
            [Network.mainnet().chainId]: {
                apiClient: {
                    url: 'https://toncenter.com',
                    key: 'your-key',
                },
            },
        },
        connectors: [new TonConnectConnector({ tonConnectUI })],
    });
    // SAMPLE_END: TON_CONNECT_CONNECTOR

    return appKit;
};

export const tonConnectOptionsExample = async () => {
    // SAMPLE_START: TON_CONNECT_OPTIONS
    const appKit = new AppKit({
        networks: {
            [Network.mainnet().chainId]: {
                apiClient: {
                    url: 'https://toncenter.com',
                    key: 'your-key',
                },
            },
        },
        connectors: [
            new TonConnectConnector({
                tonConnectOptions: {
                    manifestUrl: 'https://my-app.com/tonconnect-manifest.json',
                },
            }),
        ],
    });
    // SAMPLE_END: TON_CONNECT_OPTIONS

    return appKit;
};

export const addConnectorExample = async () => {
    // SAMPLE_START: ADD_CONNECTOR
    // 1. Initialize AppKit
    const appKit = new AppKit({
        networks: {
            [Network.mainnet().chainId]: {
                apiClient: {
                    url: 'https://toncenter.com',
                    key: 'your-key',
                },
            },
        },
    });

    // 2. Initialize TonConnect connector
    const connector = new TonConnectConnector({
        tonConnectOptions: {
            manifestUrl: 'https://my-app.com/tonconnect-manifest.json',
        },
    });

    // 3. Add connector dynamically
    appKit.addConnector(connector);
    // SAMPLE_END: ADD_CONNECTOR

    return appKit;
};
