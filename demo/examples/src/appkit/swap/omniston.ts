/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AppKit, Network, registerProvider } from '@ton/appkit';
import { OmnistonSwapProvider } from '@ton/appkit/swap/omniston';

export const swapProviderInitExample = async () => {
    // SAMPLE_START: SWAP_PROVIDER_INIT
    // Initialize AppKit with swap provider
    const appKit = new AppKit({
        networks: {
            [Network.mainnet().chainId]: {
                apiClient: {
                    url: 'https://toncenter.com',
                    key: 'your-key',
                },
            },
        },
        providers: [
            new OmnistonSwapProvider({
                // Optional configuration
                apiUrl: 'https://api.ston.fi',
                defaultSlippageBps: 100, // 1%
            }),
        ],
    });
    // SAMPLE_END: SWAP_PROVIDER_INIT

    return appKit;
};

export const swapProviderRegisterExample = async () => {
    // SAMPLE_START: SWAP_PROVIDER_REGISTER
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

    // 2. Register swap provider
    const provider = new OmnistonSwapProvider({
        // Optional configuration
        apiUrl: 'https://api.ston.fi',
    });

    registerProvider(appKit, provider);
    // SAMPLE_END: SWAP_PROVIDER_REGISTER

    return appKit;
};
