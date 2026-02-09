/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AppKit } from '@ton/appkit';
import { TonConnectConnector } from '@ton/appkit/tonconnect';
import { TonConnectUI } from '@tonconnect/ui';
import {
    watchConnectedWallets,
    watchSelectedWallet,
    getConnectedWallets,
    getSelectedWallet,
    setSelectedWalletId,
} from '@ton/appkit';

export const setupAppKitExample = () => {
    // Initialize AppKit
    const appKit = new AppKit({
        networks: {
            '-239': {}, // Mainnet
        },
    });

    // Create TonConnectUI instance
    // Note: In a browser environment
    const tonConnect = new TonConnectUI({
        manifestUrl: 'https://my-app.com/tonconnect-manifest.json',
    });

    // Add TonConnect connector
    appKit.addConnector(new TonConnectConnector({ tonConnect }));

    return appKit;
};

export const walletConnectionExample = (appKit: AppKit) => {
    // Watch for connected wallets
    const _close = watchConnectedWallets(appKit, {
        onChange: (wallets) => {
            console.log('Connected wallets:', wallets);
        },
    });

    // Watch for selected wallet
    const _closeSelected = watchSelectedWallet(appKit, {
        onChange: (wallet) => {
            console.log('Selected wallet:', wallet);
        },
    });

    // Get current state
    const wallets = getConnectedWallets(appKit);
    const _selected = getSelectedWallet(appKit);

    // Select a specific wallet
    if (wallets.length > 0) {
        setSelectedWalletId(appKit, { walletId: wallets[0].getWalletId() });
    }

    // Disconnect
    // appKit.disconnect();
};
