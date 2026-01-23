/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-console */

// Example: AppKit usage with TonConnect

import TonConnect from '@tonconnect/sdk';
import { Network } from '@ton/walletkit';

import { CreateAppKit, TonConnectProvider, WALLET_EVENTS } from '../index';
import { FSStorage } from './fs-storage';

async function main() {
    const tonConnect = new TonConnect({
        storage: new FSStorage('./temp/storage.json'),
        manifestUrl: 'https://tonconnect-demo-dapp-with-react-ui.vercel.app/tonconnect-manifest.json',
    });

    // Create AppKit with network configuration
    const appKit = CreateAppKit({
        networks: {
            [Network.mainnet().chainId]: {
                apiClient: {
                    // Optional API key for Toncenter - get one at https://t.me/toncenter
                    key: process.env.APP_TONCENTER_KEY,
                    url: 'https://toncenter.com', // default
                },
            },
        },
    });

    // Register TonConnect provider
    const tonConnectProvider = new TonConnectProvider({ tonConnect });
    appKit.registerProvider(tonConnectProvider);

    // Listen for wallet events
    appKit.eventBus.on(WALLET_EVENTS.CONNECTED, async () => {
        console.log('Wallet connected!');

        const wallets = await appKit.getConnectedWallets();
        const tonWallet = wallets[0];

        if (tonWallet) {
            await tonWallet.createTransferJettonTransaction({
                transferAmount: '1',
                jettonAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
                recipientAddress: tonWallet.getAddress(),
                comment: 'Hello!',
            });
        }
    });

    appKit.eventBus.on(WALLET_EVENTS.DISCONNECTED, () => {
        console.log('Wallet disconnected!');
    });

    const wallets = await tonConnect.getWallets();
    console.log('Available wallets:', wallets.length);

    while (true) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log('Waiting...');
    }
}

main();
